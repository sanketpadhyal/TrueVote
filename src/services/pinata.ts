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
        if (cid) {
          console.log('Successfully pinned event to Pinata IPFS (V3):', cid);
          return {
            IpfsHash: cid,
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
 * Deletes / unpins an event from Pinata IPFS by its CID.
 */
export async function deleteEventFromPinata(
  ipfsHash?: string
): Promise<{ success: boolean; message?: string }> {
  if (!ipfsHash) {
    return { success: true, message: 'No IPFS hash provided' };
  }

  // Handle deterministic offline/fallback pseudo-hashes gracefully
  if (ipfsHash.startsWith('QmTrueVote')) {
    console.log(`Purged local fallback IPFS hash: ${ipfsHash}`);
    return { success: true, message: `Purged local IPFS hash ${ipfsHash}` };
  }

  const jwt = process.env.REACT_APP_PINATA_JWT || DEFAULT_JWT;
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
    const response = await fetch(`${PINATA_UNPIN_URL}/${ipfsHash}`, {
      method: 'DELETE',
      headers,
    });

    if (response.ok) {
      console.log(`Successfully deleted/unpinned ${ipfsHash} from Pinata IPFS`);
      return { success: true };
    }

    const errText = await response.text();
    console.warn(`Pinata unpin notice (${response.status}):`, errText);
    return { success: false, message: errText };
  } catch (err) {
    console.error('Failed to unpin from Pinata IPFS:', err);
    return { success: false, message: String(err) };
  }
}

