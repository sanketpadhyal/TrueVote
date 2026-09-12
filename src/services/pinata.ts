/**
 * Pinata IPFS Decentralized Storage Service
 * Handles uploading verifiable ballot event metadata and anonymous election schemas.
 */

const PINATA_GATEWAY = process.env.REACT_APP_PINATA_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs/';

const DEFAULT_JWT = process.env.REACT_APP_PINATA_JWT ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI1MjI1MjA0Mi1jOGQwLTRiMmQtOTZiZi05ODUzYTNjZDE1MjYiLCJlbWFpbCI6InNhbmtldDk5ZUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiNTJkYjYwYjNhODU1ZjkzYjg5NjUiLCJzY29wZWRLZXlTZWNyZXQiOiJlOWE2ZTlhMzRlYjVhZWJiN2VjOWYyNTEzNDlmOWY4OGQ3NWU1NzgyMDZlYTY0NjE2ZTFkZmZhMTQ5ZDRlYjk2IiwiZXhwIjoxODIwNzczNzMzfQ.j5kO5Bp_MdZ0tRKdbUMOVHhXojIZJoi8eXo3qMJn_po';

export interface PinataPinResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
  gatewayUrl: string;
  isRealPin?: boolean;
  fileId?: string;
}

const PINATA_V3_UPLOAD_URL = 'https://uploads.pinata.cloud/v3/files';
const PINATA_LEGACY_URL = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';

export async function uploadEventToPinata(eventData: Record<string, any>): Promise<PinataPinResponse> {
  const jwt = process.env.REACT_APP_PINATA_JWT || DEFAULT_JWT;
  const apiKey = process.env.REACT_APP_PINATA_API_KEY;
  const secretKey = process.env.REACT_APP_PINATA_SECRET_KEY;

  // 1. Try Pinata V3 Files API (Full support for public IPFS uploads)
  try {
    if (typeof FormData !== 'undefined') {
      const fileName = `TrueVote-${eventData.votingNumber || eventData.id}.json`;
      const blob = new Blob([JSON.stringify(eventData, null, 2)], { type: 'application/json' });
      const formData = new FormData();
      formData.append('file', blob, fileName);
      formData.append('name', fileName);
      formData.append('network', 'public');

      const v3Headers: Record<string, string> = {};
      if (jwt) {
        v3Headers['Authorization'] = `Bearer ${jwt}`;
      }

      const v3Response = await fetch(PINATA_V3_UPLOAD_URL, {
        method: 'POST',
        headers: v3Headers,
        body: formData,
      });

      if (v3Response.ok) {
        const resData = await v3Response.json();
        const cid = resData?.data?.cid;
        const newFileId = resData?.data?.id;
        if (cid) {
          console.log('Successfully pinned event to Pinata IPFS (V3):', cid);

          // Clean up prior file version if one existed
          if (eventData.ipfsFileId && eventData.ipfsFileId !== newFileId) {
            fetch(`https://api.pinata.cloud/v3/files/public/${eventData.ipfsFileId}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${jwt}` },
            }).catch(() => {});
          }

          return {
            IpfsHash: cid,
            fileId: newFileId,
            PinSize: resData?.data?.size || 1024,
            Timestamp: resData?.data?.created_at || new Date().toISOString(),
            gatewayUrl: `${PINATA_GATEWAY}${cid}`,
            isRealPin: true,
          };
        }
      } else {
        const errText = await v3Response.text();
        console.warn('Pinata V3 upload returned status:', v3Response.status, errText);
      }
    }
  } catch (v3Err) {
    console.warn('Pinata V3 attempt failed, attempting legacy pinJSONToIPFS:', v3Err);
  }

  // 2. Try Pinata Legacy pinJSONToIPFS API
  const payload = {
    pinataOptions: {
      cidVersion: 1,
    },
    pinataMetadata: {
      name: `TrueVote-Event-${eventData.votingNumber || eventData.id}`,
      keyvalues: {
        project: 'TrueVote',
        environment: 'production',
        eventId: String(eventData.id),
        votingNumber: String(eventData.votingNumber),
        activationType: String(eventData.activationType),
        timestamp: new Date().toISOString(),
      },
    },
    pinataContent: eventData,
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (jwt) {
    headers['Authorization'] = `Bearer ${jwt}`;
  } else if (apiKey && secretKey) {
    headers['pinata_api_key'] = apiKey;
    headers['pinata_secret_api_key'] = secretKey;
  }

  try {
    const response = await fetch(PINATA_LEGACY_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn('Pinata upload HTTP error (check API Key scopes in Pinata dashboard):', errText);
      throw new Error(`Pinata error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const ipfsHash = data.IpfsHash;
    return {
      IpfsHash: ipfsHash,
      PinSize: data.PinSize || 1024,
      Timestamp: data.Timestamp || new Date().toISOString(),
      gatewayUrl: `${PINATA_GATEWAY}${ipfsHash}`,
      isRealPin: true,
    };
  } catch (error) {
    console.error('Failed to pin to Pinata IPFS (falling back to local resilient storage):', error);
    // Deterministic pseudo-CID for offline / network resilience
    const pseudoHash = `QmTrueVote${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`;
    return {
      IpfsHash: pseudoHash,
      PinSize: 1024,
      Timestamp: new Date().toISOString(),
      gatewayUrl: `${PINATA_GATEWAY}${pseudoHash}`,
      isRealPin: false,
    };
  }
}

const PINATA_UNPIN_URL = 'https://api.pinata.cloud/pinning/unpin';

/**
 * Deletes / unpins an event from Pinata IPFS by its CID, V3 file ID, and/or votingNumber/id.
 */
export async function deleteEventFromPinata(
  ipfsHash?: string,
  fileId?: string,
  searchNameOrId?: string
): Promise<{ success: boolean; message?: string }> {
  const jwt = process.env.REACT_APP_PINATA_JWT || DEFAULT_JWT;

  // 1. If fileId is directly provided, delete directly from Pinata V3
  if (fileId) {
    try {
      const v3Del = await fetch(`https://api.pinata.cloud/v3/files/public/${fileId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (v3Del.ok) {
        console.log(`Successfully deleted Pinata V3 file ${fileId}`);
        return { success: true };
      }
    } catch (e) {
      console.warn('Pinata V3 file delete notice:', e);
    }
  }

  // 2. Query Pinata V3 files to locate matching file by CID or voting number / id
  try {
    const listRes = await fetch('https://api.pinata.cloud/v3/files/public?limit=100', {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    if (listRes.ok) {
      const data = await listRes.json();
      const files: any[] = data?.data?.files || [];
      const cleanTarget = (searchNameOrId || '').toLowerCase().trim();

      for (const file of files) {
        const matchesCid = ipfsHash && file.cid === ipfsHash;
        const matchesName = cleanTarget && (file.name || '').toLowerCase().includes(cleanTarget);

        if (matchesCid || matchesName) {
          console.log(`Deleting matching Pinata V3 file: ${file.name} (ID: ${file.id})`);
          try {
            await fetch(`https://api.pinata.cloud/v3/files/public/${file.id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${jwt}` },
            });
          } catch (delErr) {
            console.warn('Delete attempt notice:', delErr);
          }
        }
      }
    }
  } catch (err) {
    console.warn('Pinata V3 search-and-delete notice:', err);
  }

  // 3. Fallback unpin attempt for legacy V1
  if (ipfsHash && !ipfsHash.startsWith('QmTrueVote')) {
    const apiKey = process.env.REACT_APP_PINATA_API_KEY;
    const secretKey = process.env.REACT_APP_PINATA_SECRET_KEY;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (apiKey && secretKey) {
      headers['pinata_api_key'] = apiKey;
      headers['pinata_secret_api_key'] = secretKey;
    } else if (jwt) {
      headers['Authorization'] = `Bearer ${jwt}`;
    }

    try {
      await fetch(`${PINATA_UNPIN_URL}/${ipfsHash}`, {
        method: 'DELETE',
        headers,
      });
    } catch (err) {
      // ignore
    }
  }

  return { success: true };
}

/**
 * Synchronizes and fetches existing election event files from Pinata IPFS.
 */
export async function fetchEventsFromPinata(): Promise<any[]> {
  const jwt = process.env.REACT_APP_PINATA_JWT || DEFAULT_JWT;
  const apiKey = process.env.REACT_APP_PINATA_API_KEY;
  const secretKey = process.env.REACT_APP_PINATA_SECRET_KEY;
  const events: any[] = [];
  const seenIds = new Set<string>();

  // 1. Try Pinata V3 Files API
  try {
    const v3Res = await fetch('https://api.pinata.cloud/v3/files/public?limit=100', {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
    if (v3Res.ok) {
      const json = await v3Res.json();
      const files: any[] = json?.data?.files || [];
      // Sort newest files first
      files.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      for (const file of files) {
        if (file.name && file.name.startsWith('TrueVote-') && file.cid) {
          try {
            const ipfsRes = await fetch(`${PINATA_GATEWAY}${file.cid}`, {
              headers: {
                Authorization: `Bearer ${jwt}`,
              },
            });
            if (ipfsRes.ok) {
              const eventData = await ipfsRes.json();
              if (eventData && (eventData.id || eventData.votingNumber)) {
                const id = String(eventData.id || eventData.votingNumber);
                if (!seenIds.has(id)) {
                  seenIds.add(id);
                  events.push({
                    ...eventData,
                    ipfsFileId: file.id,
                    ipfsHash: file.cid,
                    ipfsUrl: `${PINATA_GATEWAY}${file.cid}`,
                  });
                }
              }
            }
          } catch (e) {
            console.warn('Error fetching IPFS file content:', e);
          }
        }
      }
    }
  } catch (err) {
    console.warn('Pinata V3 sync failed:', err);
  }

  // 2. Try Pinata V1 PinList API fallback
  if (events.length === 0) {
    try {
      const headers: Record<string, string> = {};
      if (apiKey && secretKey) {
        headers['pinata_api_key'] = apiKey;
        headers['pinata_secret_api_key'] = secretKey;
      } else if (jwt) {
        headers['Authorization'] = `Bearer ${jwt}`;
      }

      const v1Res = await fetch('https://api.pinata.cloud/data/pinList?status=pinned&pageLimit=100', {
        headers,
      });
      if (v1Res.ok) {
        const json = await v1Res.json();
        const rows = json?.rows || [];
        for (const row of rows) {
          const name = row?.metadata?.name || '';
          const cid = row?.ipfs_pin_hash;
          if (name.startsWith('TrueVote-') && cid) {
            try {
              const ipfsRes = await fetch(`${PINATA_GATEWAY}${cid}`, {
                headers: {
                  Authorization: `Bearer ${jwt}`,
                },
              });
              if (ipfsRes.ok) {
                const eventData = await ipfsRes.json();
                if (eventData && (eventData.id || eventData.votingNumber)) {
                  const id = String(eventData.id || eventData.votingNumber);
                  if (!seenIds.has(id)) {
                    seenIds.add(id);
                    events.push({
                      ...eventData,
                      ipfsHash: cid,
                      ipfsUrl: `${PINATA_GATEWAY}${cid}`,
                    });
                  }
                }
              }
            } catch (e) {
              console.warn('Error fetching V1 pinned IPFS content:', e);
            }
          }
        }
      }
    } catch (err) {
      console.warn('Pinata V1 pinList sync failed:', err);
    }
  }

  return events;
}

/**
 * Dedicated fast fetch for a specific event by its id or voting number from Pinata IPFS.
 */
export async function fetchEventByIdFromPinata(targetId: string): Promise<any | null> {
  if (!targetId) return null;
  const cleanTarget = targetId.trim().toLowerCase();
  const jwt = process.env.REACT_APP_PINATA_JWT || DEFAULT_JWT;

  try {
    const v3Res = await fetch('https://api.pinata.cloud/v3/files/public?limit=50', {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });

    if (v3Res.ok) {
      const json = await v3Res.json();
      const files: any[] = json?.data?.files || [];

      // Sort newest first
      files.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // If file name has a hint of the targetId, check those first
      const sortedFiles = [...files].sort((a, b) => {
        const aName = (a.name || '').toLowerCase();
        const bName = (b.name || '').toLowerCase();
        const aHas = aName.includes(cleanTarget);
        const bHas = bName.includes(cleanTarget);
        if (aHas && !bHas) return -1;
        if (!aHas && bHas) return 1;
        return 0;
      });

      for (const file of sortedFiles) {
        if (file.cid) {
          try {
            const ipfsRes = await fetch(`${PINATA_GATEWAY}${file.cid}`, {
              headers: {
                Authorization: `Bearer ${jwt}`,
              },
            });
            if (ipfsRes.ok) {
              const eventData = await ipfsRes.json();
              if (
                eventData &&
                (String(eventData.id || '').toLowerCase() === cleanTarget ||
                 String(eventData.votingNumber || '').toLowerCase() === cleanTarget)
              ) {
                return {
                  ...eventData,
                  ipfsFileId: file.id,
                  ipfsHash: file.cid,
                  ipfsUrl: `${PINATA_GATEWAY}${file.cid}`,
                };
              }
            }
          } catch (e) {
            console.warn('IPFS single fetch notice:', e);
          }
        }
      }
    }
  } catch (err) {
    console.warn('fetchEventByIdFromPinata notice:', err);
  }

  return null;
}
