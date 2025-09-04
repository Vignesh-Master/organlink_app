import axios from "axios";
import FormData from "form-data";

const PINATA_API_URL = "https://api.pinata.cloud";
const PINATA_GATEWAY = "https://gateway.pinata.cloud/ipfs";

export class IPFSService {
  private apiKey: string;
  private apiSecret: string;
  private jwtToken: string;

  constructor() {
    this.apiKey = process.env.PINATA_API_KEY || "";
    this.apiSecret = process.env.PINATA_API_SECRET || "";
    this.jwtToken = process.env.PINATA_JWT_TOKEN || "";
  }

  // Pin file to IPFS
  async pinFile(
    fileBuffer: Buffer,
    fileName: string,
    metadata?: any,
  ): Promise<string> {
    try {
      const formData = new FormData();
      formData.append("file", fileBuffer, fileName);

      if (metadata) {
        formData.append(
          "pinataMetadata",
          JSON.stringify({
            name: fileName,
            keyvalues: metadata,
          }),
        );
      }

      const response = await axios.post(
        `${PINATA_API_URL}/pinning/pinFileToIPFS`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${this.jwtToken}`,
          },
        },
      );

      return response.data.IpfsHash;
    } catch (error) {
      console.error("IPFS pinning error:", error);
      throw new Error("Failed to pin file to IPFS");
    }
  }

  // Pin JSON data to IPFS
  async pinJSON(jsonData: any, name: string): Promise<string> {
    try {
      const response = await axios.post(
        `${PINATA_API_URL}/pinning/pinJSONToIPFS`,
        {
          pinataContent: jsonData,
          pinataMetadata: {
            name: name,
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.jwtToken}`,
          },
        },
      );

      return response.data.IpfsHash;
    } catch (error) {
      console.error("IPFS JSON pinning error:", error);
      throw new Error("Failed to pin JSON to IPFS");
    }
  }

  // Get file from IPFS
  async getFile(ipfsHash: string): Promise<Buffer> {
    try {
      const response = await axios.get(`${PINATA_GATEWAY}/${ipfsHash}`, {
        responseType: "arraybuffer",
      });

      return Buffer.from(response.data);
    } catch (error) {
      console.error("IPFS retrieval error:", error);
      throw new Error("Failed to retrieve file from IPFS");
    }
  }

  // Get file URL
  getFileUrl(ipfsHash: string): string {
    return `${PINATA_GATEWAY}/${ipfsHash}`;
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      const response = await axios.get(
        `${PINATA_API_URL}/data/testAuthentication`,
        {
          headers: {
            Authorization: `Bearer ${this.jwtToken}`,
          },
        },
      );

      return response.status === 200;
    } catch (error) {
      console.error("IPFS connection test failed:", error);
      return false;
    }
  }

  // Unpin file (optional - for cleanup)
  async unpinFile(ipfsHash: string): Promise<boolean> {
    try {
      await axios.delete(`${PINATA_API_URL}/pinning/unpin/${ipfsHash}`, {
        headers: {
          Authorization: `Bearer ${this.jwtToken}`,
        },
      });

      return true;
    } catch (error) {
      console.error("IPFS unpin error:", error);
      return false;
    }
  }
}

export const ipfsService = new IPFSService();
