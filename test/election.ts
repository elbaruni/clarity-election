import {
  Client,
  Provider,
  ProviderRegistry,
  Result,
} from "@blockstack/clarity";
import { assert } from "chai";
const address = [
  "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7",
  "STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6",
  "ST11NJTTKGVT6D1HY4NJRVQWMQM7TVAR091EJ8P2Y",
  "ST1HB1T8WRNBYB0Y3T7WXZS38NKKPTBR3EG9EPJKR",
  "STRYYQQ9M8KAF4NS7WNZQYY59X93XEKR31JP64CP",
];
const deployer = address[0];
const voters = address.slice(1, address.length);
const Candidate1 = 1;
const Candidate2 = 2;

describe("voting contract test suite", () => {
  let votingClient: Client;
  let provider: Provider;

  const getNumberOfCandidates = async () => {
    const query = votingClient.createQuery({
      method: { name: "getNumberOfCandidates", args: [] },
    });
    const receipt = await votingClient.submitQuery(query);
    const result = Result.unwrapInt(receipt);
    return result;
  };
  const isVotingOpen = async () => {
    const query = votingClient.createQuery({
      method: { name: "isVotingOpen", args: [] },
    });
    const receipt = await votingClient.submitQuery(query);
    const result = Result.unwrapInt(receipt);
    return result;
  };
  const isRegistrationOpen = async () => {
    const query = votingClient.createQuery({
      method: { name: "isRegistrationOpen", args: [] },
    });
    const receipt = await votingClient.submitQuery(query);
    const result = Result.unwrapInt(receipt);
    return result;
  };
  const getCandidateName = async (id: number) => {
    const query = votingClient.createQuery({
      method: { name: "getCandidateName", args: [`${id}`] },
    });
    const receipt = await votingClient.submitQuery(query);
    const result = Result.unwrapString(receipt).toString();
    return result;
  };
  const getCandidateVoteCount = async (id: number) => {
    const query = votingClient.createQuery({
      method: { name: "getCandidateVotesCount", args: [`${id}`] },
    });
    const receipt = await votingClient.submitQuery(query);
    const result = Result.unwrapUInt(receipt);
    return result;
  };
  const startRegistration = async (signer: string) => {
    const tx = votingClient.createTransaction({
      method: { name: "startRegistration", args: [] },
    });
    await tx.sign(signer);
    const receipt = await votingClient.submitTransaction(tx);
    return receipt;
  };

  const vote = async (signer: string, id: number) => {
    const tx = votingClient.createTransaction({
      method: { name: "vote", args: [`${id}`] },
    });
    await tx.sign(signer);
    const receipt = await votingClient.submitTransaction(tx);
    return receipt;
  };

  const endRegistration = async (signer: string) => {
    const tx = votingClient.createTransaction({
      method: { name: "endRegistration", args: [] },
    });
    await tx.sign(signer);
    const receipt = await votingClient.submitTransaction(tx);
    return receipt;
  };

  const startElection = async (signer: string) => {
    const tx = votingClient.createTransaction({
      method: { name: "startElection", args: [] },
    });
    await tx.sign(signer);
    const receipt = await votingClient.submitTransaction(tx);
    return receipt;
  };

  const endElection = async (signer: string) => {
    const tx = votingClient.createTransaction({
      method: { name: "endElection", args: [] },
    });
    await tx.sign(signer);
    const receipt = await votingClient.submitTransaction(tx);
    return receipt;
  };

  const registerNewCandidate = async (
    candidateName: string,
    signer: string
  ) => {
    const tx = votingClient.createTransaction({
      method: { name: "addCandidate", args: [`${candidateName}`] },
    });
    await tx.sign(signer);
    const receipt = await votingClient.submitTransaction(tx);
    // console.log(receipt);
    return receipt;
  };
  before(async () => {
    provider = await ProviderRegistry.createProvider();
    votingClient = new Client(`${deployer}.election`, "election", provider);
  });
  it("should have a valid syntax", async () => {
    await votingClient.checkContract();
  });
  describe("deploying an instance of the contract", () => {
    let deploymentReceipt;

    before(async () => {
      deploymentReceipt = await votingClient.deployContract();
    });
    it("should deployed succeffully", async () => {
      assert.isTrue(deploymentReceipt.success);
    });
    it("should registeration is open  ='1' by default", async () => {
      let registerationStatus = await isRegistrationOpen();

      assert.equal(registerationStatus, 1);
    });
    it("should voting is open  ='1' by default", async () => {
      let votingStatus = await isVotingOpen();

      assert.equal(votingStatus, 1);
    });
  });
  describe("admin functions  ", () => {
    it("should change Registeration status", async () => {
      let registerationStatus: number;
      await endRegistration(deployer);
      registerationStatus = await isRegistrationOpen();
      assert.equal(registerationStatus, 0);
      await startRegistration(deployer);
    });
    it("should admin only allowed to change Registeration status ", async () => {
      let registerationStatus: number;
      await endRegistration(voters[0]);
      registerationStatus = await isRegistrationOpen();
      assert.equal(registerationStatus, 1);
    });

    it("should change Election status", async () => {
      let ElectionStatus: number;
      await endElection(deployer);
      ElectionStatus = await isVotingOpen();
      assert.equal(ElectionStatus, 0);
      await startElection(deployer);
    });
    it("should admin only allowed to change Election status ", async () => {
      let ElectionStatus: number;
      await endElection(voters[0]);
      ElectionStatus = await isVotingOpen();
      assert.equal(ElectionStatus, 1);
    });

    it("should add new candidates", async () => {
      await registerNewCandidate('"Candidate 1"', deployer);
      await registerNewCandidate('"Candidate 2"', deployer);
      let numberOfCandidates = await getNumberOfCandidates();
      assert.equal(numberOfCandidates, 2);
    });

    it("should only admin can register a new candidates", async () => {
      let result = await registerNewCandidate('"Candidate 3"', voters[0]);
      assert.isFalse(result.success);
    });

    it("should only admin can register a new candidates if registration set to open=1", async () => {
      await endRegistration(deployer);
      let result = await registerNewCandidate('"Candidate 4"', deployer);
      assert.isFalse(result.success);
      await startRegistration(deployer);
    });
  });
  describe("Voting Functions  ", () => {
    it("should any principal address able to cast a vote ", async () => {
      let result = await vote(voters[0], Candidate1);
      const candidate1VotesCount = await getCandidateVoteCount(Candidate1);
      assert.isTrue(result.success);
      assert.equal(candidate1VotesCount, 1);
      await vote(voters[2], Candidate1);
      await vote(voters[3], Candidate2);
    });
    it("should a voter can vote only once  ", async () => {
      let result = await vote(voters[0], Candidate1);
      const candidate1VotesCount = await getCandidateVoteCount(Candidate1);
      assert.isFalse(result.success);
      assert.equal(candidate1VotesCount, 2);
    });
    it("should a voter can vote only if Election is open for voting  ", async () => {
      await endElection(deployer);
      let result = await vote(voters[1], Candidate1);
      let candidate1VotesCount = await getCandidateVoteCount(Candidate1);
      assert.isFalse(result.success);
      assert.equal(candidate1VotesCount, 2);
      await startElection(deployer);
      result = await vote(voters[1], Candidate1);
      candidate1VotesCount = await getCandidateVoteCount(Candidate1);
      assert.isTrue(result.success);
      assert.equal(candidate1VotesCount, 3);
    });
  });

  describe("Candidates Information  ", () => {
    it("should get correct Number of Candidates ", async () => {
      let numberOfCandidates = await getNumberOfCandidates();
      assert.equal(numberOfCandidates, 2);
    });
    it("should get correct Candidate Name  ", async () => {
      const Name1 = await getCandidateName(Candidate1);
      assert.equal(Name1, "Candidate 1");
      const Name2 = await getCandidateName(Candidate2);
      assert.equal(Name2, "Candidate 2");
    });
    it("should get correct Candidate Votes Count", async () => {
      const Count1 = await getCandidateVoteCount(Candidate1);
      assert.equal(Count1, 3);
      const Count2 = await getCandidateVoteCount(Candidate2);
      assert.equal(Count2, 1);
    });
  });
  after(async () => {
    await provider.close();
  });
});
