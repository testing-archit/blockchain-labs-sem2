const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("UniversityCredentials Contract", function () {
    let Credential;
    let credential;
    let admin;
    let student;
    let otherAccount;

    beforeEach(async function () {
        [admin, student, otherAccount] = await ethers.getSigners();
        Credential = await ethers.getContractFactory("UniversityCredentials");
        credential = await Credential.deploy();
    });

    // ── Test Case 1: Admin can add credential ──
    it("Should allow admin to add credentials", async function () {
        await credential.connect(admin).addCredential(
            student.address, "Alice", "Blockchain 101", "QmHash123"
        );

        const creds = await credential.getCredentials(student.address);
        expect(creds.length).to.equal(1);
        expect(creds[0].name).to.equal("Alice");
        expect(creds[0].course).to.equal("Blockchain 101");
        expect(creds[0].hash).to.equal("QmHash123");
        expect(creds[0].issuedOn).to.be.greaterThan(0);
    });

    // ── Test Case 2: Non-admin cannot add credential ──
    it("Should not allow non-admin to add credentials", async function () {
        await expect(
            credential.connect(otherAccount).addCredential(
                student.address, "Hacker", "Hacking 101", "QmHack"
            )
        ).to.be.revertedWith("Only admin allowed");
    });

    // ── Test Case 3: Student can view credentials ──
    it("Should allow student to view credentials", async function () {
        await credential.connect(admin).addCredential(
            student.address, "Bob", "BTech CSE", "QmDegree"
        );

        // Connect as student to read
        const creds = await credential.connect(student).getCredentials(student.address);
        expect(creds.length).to.equal(1);
        expect(creds[0].name).to.equal("Bob");
        expect(creds[0].course).to.equal("BTech CSE");
        expect(creds[0].hash).to.equal("QmDegree");
    });

    // ── Test Case 4: Admin can update credential ──
    it("Should allow admin to update credential hash", async function () {
        await credential.connect(admin).addCredential(
            student.address, "Carol", "MSc Data Science", "QmOldHash"
        );

        await credential.connect(admin).updateCredential(
            student.address, 0, "QmNewHash"
        );

        const creds = await credential.getCredentials(student.address);
        expect(creds[0].hash).to.equal("QmNewHash");
    });

    // ── Test Case 5: Events emitted correctly ──
    it("Should emit CredentialAdded event with correct parameters", async function () {
        await expect(
            credential.connect(admin).addCredential(
                student.address, "Dave", "CSE", "QmEventHash"
            )
        )
            .to.emit(credential, "CredentialAdded")
            .withArgs(student.address, "CSE", (val) => val > 0);
    });

    it("Should emit CredentialUpdated event with correct parameters", async function () {
        await credential.connect(admin).addCredential(
            student.address, "Eve", "ECE", "QmOriginal"
        );

        await expect(
            credential.connect(admin).updateCredential(
                student.address, 0, "QmUpdated"
            )
        )
            .to.emit(credential, "CredentialUpdated")
            .withArgs(student.address, (val) => val > 0);
    });

    // ── Security Tests (Task 5) ──
    it("Should not allow non-admin to update credential", async function () {
        await credential.connect(admin).addCredential(
            student.address, "Frank", "Physics", "QmPhysics"
        );

        await expect(
            credential.connect(otherAccount).updateCredential(
                student.address, 0, "QmTampered"
            )
        ).to.be.revertedWith("Only admin allowed");

        // Verify hash was NOT tampered
        const creds = await credential.getCredentials(student.address);
        expect(creds[0].hash).to.equal("QmPhysics");
    });

    it("Should compute correct keccak256 hash for integrity verification", async function () {
        const name = "Grace";
        const course = "Mathematics";

        // Compute hash on-chain
        const onChainHash = await credential.computeHash(name, course);

        // Compute hash off-chain using ethers
        const offChainHash = ethers.solidityPackedKeccak256(
            ["string", "string"],
            [name, course]
        );

        expect(onChainHash).to.equal(offChainHash);
    });

    it("Should reject updateCredential with invalid index", async function () {
        await expect(
            credential.connect(admin).updateCredential(
                student.address, 999, "QmBadIndex"
            )
        ).to.be.revertedWith("Invalid index");
    });
});
