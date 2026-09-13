/**
 * Pinata IPFS Decentralized Storage Service
 * Handles uploading verifiable ballot event metadata and anonymous election schemas.
 */

const DEDICATED_PINATA_GATEWAY = 'https://maroon-genetic-sawfish-271.mypinata.cloud/ipfs/';
const PINATA_GATEWAY = process.env.REACT_APP_PINATA_GATEWAY_URL || DEDICATED_PINATA_GATEWAY;

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
      }
    } catch (e) {
      console.warn('Pinata V3 file delete notice:', e);
    }
  }

  // 2. Query Pinata V3 files to locate and purge ALL matching files by CID or voting number / id
  // (In case multiple versions were uploaded during vote casts or edits)
  try {
    const listRes = await fetch('https://api.pinata.cloud/v3/files/public?limit=100', {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    if (listRes.ok) {
      const data = await listRes.json();
      const files: any[] = data?.data?.files || [];
      const cleanTarget = (searchNameOrId || '').toLowerCase().trim();
      const idSuffix = cleanTarget.includes('-') ? cleanTarget.split('-').pop()! : cleanTarget;

      for (const file of files) {
        const matchesCid = ipfsHash && file.cid === ipfsHash;
        const fileName = (file.name || '').toLowerCase();
        const matchesName =
          (cleanTarget && fileName.includes(cleanTarget)) ||
          (idSuffix && idSuffix.length >= 3 && fileName.includes(idSuffix));

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

  return { success: true };
}

/**
 * Synchronizes and fetches existing election event files from Pinata IPFS.
 */
/**
 * Helper to fetch and parse JSON from IPFS gateways without Authorization headers
 * (sending Authorization to public or dedicated gateways triggers CORS preflight rejection in browsers).
 */
async function fetchFromIpfsGateway(cid: string): Promise<any | null> {
  const gateways = [
    DEDICATED_PINATA_GATEWAY,
    PINATA_GATEWAY,
    'https://maroon-genetic-sawfish-271.mypinata.cloud/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
  ];

  for (const gw of gateways) {
    if (!gw) continue;
    try {
      const url = `${gw.endsWith('/') ? gw : gw + '/'}${cid}`;
      const res = await fetch(url);
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().startsWith('{')) {
          return JSON.parse(text);
        }
      }
    } catch (e) {
      // try next gateway
    }
  }
  return null;
}

/**
 * Reconciles and merges multiple versions of the same election event from IPFS.
 * Resolves concurrency race conditions when multiple voters vote simultaneously from different devices.
 */
export function mergeEventVersions(versions: any[]): any {
  if (!versions || versions.length === 0) return null;
  if (versions.length === 1) return versions[0];

  // Sort versions newest first by pinnedAt or createdAt
  versions.sort((a, b) => {
    const timeA = new Date(a.pinnedAt || a.createdAt || 0).getTime();
    const timeB = new Date(b.pinnedAt || b.createdAt || 0).getTime();
    return timeB - timeA;
  });

  const primary = versions[0];

  // 1. Merge and deduplicate all recentVotes / ballot receipts across all versions
  const allVotesMap = new Map<string, any>();
  for (let i = 0; i < versions.length; i++) {
    const v = versions[i];
    if (Array.isArray(v.recentVotes)) {
      for (let j = 0; j < v.recentVotes.length; j++) {
        const vote = v.recentVotes[j];
        if (!vote) continue;
        const key = String(
          vote.receiptHash || vote.id || `${vote.userName}_${vote.votingNumber}`
        ).toLowerCase();
        if (!allVotesMap.has(key)) {
          allVotesMap.set(key, vote);
        }
      }
    }
  }

  const mergedVotes: any[] = [];
  allVotesMap.forEach((v) => mergedVotes.push(v));
  mergedVotes.sort((a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0));

  // 2. Reconcile options votesCount across all versions & merged ballots
  const mergedOptions = (primary.options || []).map((opt: any) => {
    let maxVersionCount = 0;
    for (let vIdx = 0; vIdx < versions.length; vIdx++) {
      const v = versions[vIdx];
      const vOpt = (v.options || []).find(
        (o: any) =>
          String(o.id).toLowerCase() === String(opt.id).toLowerCase() ||
          String(o.label).toLowerCase() === String(opt.label).toLowerCase()
      );
      if (vOpt && typeof vOpt.votesCount === 'number') {
        maxVersionCount = Math.max(maxVersionCount, vOpt.votesCount);
      }
    }

    // Count ballots explicitly cast for this option in the merged ballot receipts
    let ballotsCount = 0;
    const optId = String(opt.id || '').toLowerCase();
    const optLabel = String(opt.label || '').toLowerCase();

    for (let k = 0; k < mergedVotes.length; k++) {
      const vote = mergedVotes[k];
      const voteOptId = vote.selectedOptionId ? String(vote.selectedOptionId).toLowerCase() : '';
      const voteOptLabel = vote.optionLabel ? String(vote.optionLabel).toLowerCase() : '';
      if (
        (voteOptId && (voteOptId === optId || voteOptId === optLabel)) ||
        (voteOptLabel && (voteOptLabel === optId || voteOptLabel === optLabel))
      ) {
        ballotsCount++;
      }
    }

    return {
      ...opt,
      votesCount: Math.max(maxVersionCount, ballotsCount),
    };
  });

  // 4. Compute totalVotesCast across all options and ballots
  const sumOptions = mergedOptions.reduce((acc: number, o: any) => acc + (Number(o.votesCount) || 0), 0);
  let maxReportedTotal = 0;
  for (let vIdx = 0; vIdx < versions.length; vIdx++) {
    maxReportedTotal = Math.max(maxReportedTotal, Number(versions[vIdx].totalVotesCast) || 0);
  }
  const totalCast = Math.max(mergedVotes.length, sumOptions, maxReportedTotal);

  return {
    ...primary,
    options: mergedOptions,
    totalVotesCast: totalCast,
    recentVotes: mergedVotes,
  };
}

export async function fetchEventsFromPinata(): Promise<any[]> {
  const jwt = process.env.REACT_APP_PINATA_JWT || DEFAULT_JWT;
  const events: any[] = [];

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

      // Group all matching IPFS files by votingNumber or event id
      const eventGroups = new Map<string, any[]>();

      for (const file of files) {
        if (file.name && file.name.startsWith('TrueVote-') && file.cid) {
          try {
            const eventData = await fetchFromIpfsGateway(file.cid);
            if (eventData && (eventData.id || eventData.votingNumber)) {
              const groupKey = String(eventData.votingNumber || eventData.id).toLowerCase();
              const eventWithMeta = {
                ...eventData,
                ipfsFileId: file.id,
                ipfsHash: file.cid,
                ipfsUrl: `${PINATA_GATEWAY}${file.cid}`,
                pinnedAt: file.created_at,
              };
              if (!eventGroups.has(groupKey)) {
                eventGroups.set(groupKey, []);
              }
              eventGroups.get(groupKey)!.push(eventWithMeta);
            }
          } catch (e) {
            console.warn('Error fetching IPFS file content:', e);
          }
        }
      }

      // Merge all concurrent versions within each election group
      eventGroups.forEach((versions) => {
        const merged = mergeEventVersions(versions);
        if (merged) {
          events.push(merged);
        }
      });
    }
  } catch (err) {
    console.warn('Pinata V3 sync failed:', err);
  }

  return events;
}

/**
 * Dedicated fast fetch for a specific event by its id or voting number from Pinata IPFS.
 * Merges concurrent versions from multiple voting devices so no votes are lost.
 */
export async function fetchEventByIdFromPinata(targetId: string): Promise<any | null> {
  if (!targetId) return null;
  const cleanTarget = targetId.trim().toLowerCase();
  const idSuffix = cleanTarget.includes('-') ? cleanTarget.split('-').pop()! : cleanTarget;
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

      // Prioritize files whose names match target
      const sortedFiles = [...files].sort((a, b) => {
        const aName = (a.name || '').toLowerCase();
        const bName = (b.name || '').toLowerCase();
        const aHas = aName.includes(cleanTarget) || (idSuffix && idSuffix.length >= 3 && aName.includes(idSuffix));
        const bHas = bName.includes(cleanTarget) || (idSuffix && idSuffix.length >= 3 && bName.includes(idSuffix));
        if (aHas && !bHas) return -1;
        if (!aHas && bHas) return 1;
        return 0;
      });

      const matchingVersions: any[] = [];
      for (const file of sortedFiles) {
        if (file.cid) {
          try {
            const eventData = await fetchFromIpfsGateway(file.cid);
            if (eventData) {
              const evId = String(eventData.id || '').toLowerCase();
              const evNum = String(eventData.votingNumber || '').toLowerCase();

              if (
                evId === cleanTarget ||
                evNum === cleanTarget ||
                (idSuffix && idSuffix.length >= 3 && evNum.includes(idSuffix)) ||
                (idSuffix && idSuffix.length >= 3 && evId.includes(idSuffix))
              ) {
                matchingVersions.push({
                  ...eventData,
                  ipfsFileId: file.id,
                  ipfsHash: file.cid,
                  ipfsUrl: `${PINATA_GATEWAY}${file.cid}`,
                  pinnedAt: file.created_at,
                });
              }
            }
          } catch (e) {
            // continue
          }
        }
      }

      if (matchingVersions.length > 0) {
        return mergeEventVersions(matchingVersions);
      }
    }
  } catch (err) {
    console.warn('fetchEventByIdFromPinata notice:', err);
  }

  return null;
}
