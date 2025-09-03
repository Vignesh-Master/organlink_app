import express from "express";
import { pool } from "../config/database.js";
import { authenticateToken, AuthRequest } from "../middleware/auth.js";
import { blockchainService } from "../services/blockchain.js";
import { ipfsService } from "../services/ipfs.js";
import NotificationService from "../services/notificationService.js";

const router = express.Router();

// All routes require organization auth
router.use(authenticateToken);

function requireOrganization(
  req: AuthRequest,
  res: express.Response,
  next: express.NextFunction,
) {
  if (!req.user || req.user.type !== "organization") {
    return res
      .status(403)
      .json({ success: false, error: "Organization access required" });
  }
  next();
}

router.use(requireOrganization);

// Create proposal by receiving a rich form (title/rationale/parameters/hours)
router.post("/propose-form", async (req: AuthRequest, res) => {
  try {
    const { title, rationale, parameters, hours } = req.body as any;
    if (!title || !rationale)
      return res
        .status(400)
        .json({ success: false, error: "title and rationale are required" });

    const orgRes = await pool.query(
      "SELECT id, name FROM organizations WHERE email = $1",
      [req.user!.email],
    );
    if (!orgRes.rows.length)
      return res
        .status(404)
        .json({ success: false, error: "Organization not found" });
    const proposerOrgId = Number(orgRes.rows[0].id);

    let parsedParams: any = undefined;
    try {
      if (parameters) parsedParams = JSON.parse(parameters);
    } catch {}

    const payload = {
      title,
      rationale,
      parameters: parsedParams ?? parameters ?? null,
      createdAt: new Date().toISOString(),
    };
    const cid = await ipfsService.pinJSON(payload, `policy_${Date.now()}`);

  const now = Math.floor(Date.now() / 1000);
  const hoursNum = Number(hours);
  const safeHours = !isNaN(hoursNum) && hoursNum > 0 ? hoursNum : 24;
  const end = now + safeHours * 3600;

    const { txHash, proposalId } =
      await blockchainService.createProposalOnBehalf(
        proposerOrgId,
        cid,
        now,
        end,
      );

    await pool.query(
      `INSERT INTO policies (title, description, category, status, proposer_org_id, votes_for, votes_against, created_at)
       VALUES ($1, $2, $3, $4, $5, 0, 0, CURRENT_TIMESTAMP)`,
      [title, `IPFS ${cid}`, "governance", "voting", proposerOrgId],
    );

    try {
      await NotificationService.broadcastToAllHospitals(
        "New Policy Proposal",
        `${orgRes.rows[0].name} proposed: ${title}`,
      ); // demo broadcast
    } catch {}

    res.json({ success: true, txHash, proposalId, ipfsCid: cid });
  } catch (error: any) {
    console.error("Propose-form error:", error);
    res
      .status(500)
      .json({
        success: false,
        error: error.message || "Failed to create proposal",
      });
  }
});

// Create a proposal on behalf of the authenticated organization
router.post("/propose", async (req: AuthRequest, res) => {
  try {
    const { ipfs_cid, start_time, end_time } = req.body as any;
    if (!ipfs_cid || !end_time) {
      return res
        .status(400)
        .json({ success: false, error: "ipfs_cid and end_time are required" });
    }

    // Lookup org id from DB by email
    const orgRes = await pool.query(
      "SELECT id FROM organizations WHERE email = $1",
      [req.user!.email],
    );
    if (!orgRes.rows.length)
      return res
        .status(404)
        .json({ success: false, error: "Organization not found" });
    const proposerOrgId = Number(orgRes.rows[0].id);

    const now = Math.floor(Date.now() / 1000);
    const start = Number(start_time || now);
    const end = Number(end_time);

    const { txHash, proposalId } =
      await blockchainService.createProposalOnBehalf(
        proposerOrgId,
        String(ipfs_cid),
        start,
        end,
      );

    // Store basic metadata for listing
    await pool.query(
      `INSERT INTO policies (title, description, category, status, proposer_org_id, votes_for, votes_against, created_at)
       VALUES ($1, $2, $3, $4, $5, 0, 0, CURRENT_TIMESTAMP)`,
      [
        `Policy ${proposalId}`,
        `IPFS ${ipfs_cid}`,
        "governance",
        "voting",
        proposerOrgId,
      ],
    );

    res.json({ success: true, txHash, proposalId });
  } catch (error: any) {
    console.error("Create proposal error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create proposal",
    });
  }
});

// Cast a vote on behalf of an organization (For=1, Against=2, Abstain=3)
router.post("/vote", async (req: AuthRequest, res) => {
  try {
    const { proposal_id, vote } = req.body as any;
    if (!proposal_id || !vote)
      return res
        .status(400)
        .json({ success: false, error: "proposal_id and vote required" });

    const orgRes = await pool.query(
      "SELECT id FROM organizations WHERE email = $1",
      [req.user!.email],
    );
    if (!orgRes.rows.length)
      return res
        .status(404)
        .json({ success: false, error: "Organization not found" });
    const voterOrgId = Number(orgRes.rows[0].id);

    const txHash = await blockchainService.castVoteOnBehalf(
      Number(proposal_id),
      voterOrgId,
      Number(vote) as 1 | 2 | 3,
    );

    res.json({ success: true, txHash });
  } catch (error: any) {
    console.error("Vote error:", error);
    res
      .status(500)
      .json({ success: false, error: error.message || "Failed to cast vote" });
  }
});

// Finalize a proposal (admin action ideally, but allow org demo)
router.post("/finalize", async (_req: AuthRequest, res) => {
  try {
    const { proposal_id } = _req.body as any;
    if (!proposal_id)
      return res
        .status(400)
        .json({ success: false, error: "proposal_id required" });

    const txHash = await blockchainService.finalize(Number(proposal_id));

    // Reflect in local DB if present
    try {
      const tally = await blockchainService.getTally(Number(proposal_id));
      const passed =
        tally.eligibleCount > 0 &&
        tally.forVotes * 100 >= 50 * tally.eligibleCount;
      await pool.query(
        `UPDATE policies SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE title = $2`,
        [passed ? "approved" : "rejected", `Policy ${proposal_id}`],
      );
    } catch {}

    res.json({ success: true, txHash });
  } catch (error: any) {
    console.error("Finalize error:", error);
    res
      .status(500)
      .json({ success: false, error: error.message || "Failed to finalize" });
  }
});

// Read proposal info+tally
router.get("/proposal/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const proposal = await blockchainService.getProposal(id);
    const tally = await blockchainService.getTally(id);
    res.json({ success: true, proposal, tally });
  } catch (error: any) {
    console.error("Get proposal error:", error);
    res
      .status(500)
      .json({ success: false, error: error.message || "Failed to fetch" });
  }
});

export default router;
