import { useState, useEffect } from 'react';
import Web3 from 'web3';
import CredentialArtifact from './Credential.json';
import config from './config.json';
import AdminDashboard from './components/AdminDashboard';
import StudentDashboard from './components/StudentDashboard';
import './App.css';

// Hardhat default test accounts
const HARDHAT_ACCOUNTS = [
  { address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', label: 'Account #0 (Deployer)' },
  { address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', label: 'Account #1' },
  { address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', label: 'Account #2' },
  { address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906', label: 'Account #3' },
  { address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', label: 'Account #4' },
];

function App() {
  const [account, setAccount] = useState(null);
  const [web3Instance, setWeb3Instance] = useState(null);
  const [contract, setContract] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [chainId, setChainId] = useState(null);
  const [roleLabel, setRoleLabel] = useState('Guest');
  const [error, setError] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [useDirectProvider, setUseDirectProvider] = useState(false);

  useEffect(() => {
    if (window.ethereum) {
      const web3 = new Web3(window.ethereum);

      window.ethereum.on('accountsChanged', (accounts) => {
        if (!useDirectProvider) {
          handleAccountsChanged(accounts[0], web3);
        }
      });

      window.ethereum.on('chainChanged', (chainId) => {
        setChainId(parseInt(chainId, 16));
        window.location.reload();
      });
    }
  }, [useDirectProvider]);

  // Close switcher when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showSwitcher && !e.target.closest('.account-switcher-wrapper')) {
        setShowSwitcher(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSwitcher]);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        setConnecting(true);
        setError('');
        const web3 = new Web3(window.ethereum);
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });

        setChainId(parseInt(chainId, 16));
        setWeb3Instance(web3);
        setUseDirectProvider(false);

        if (parseInt(chainId, 16) !== 31337 && parseInt(chainId, 16) !== 1337) {
          setError("Wrong network — please switch to Localhost (31337).");
        } else {
          setError("");
        }

        await handleAccountsChanged(accounts[0], web3);
      } catch (err) {
        console.error(err);
        setError("Connection rejected or failed.");
      } finally {
        setConnecting(false);
      }
    } else {
      // No MetaMask — connect directly to Hardhat node
      connectDirectAccount(HARDHAT_ACCOUNTS[0]);
    }
  };

  const connectDirectAccount = async (acct) => {
    try {
      setConnecting(true);
      setError('');
      const web3 = new Web3('http://localhost:8545');
      setWeb3Instance(web3);
      setUseDirectProvider(true);
      setChainId(31337);

      await handleAccountsChanged(acct.address, web3);
      setShowSwitcher(false);
    } catch (err) {
      console.error(err);
      setError("Failed to connect to local node.");
    } finally {
      setConnecting(false);
    }
  };

  const switchToAccount = async (acct) => {
    if (useDirectProvider || !window.ethereum) {
      // Direct provider mode — just switch
      connectDirectAccount(acct);
    } else {
      // MetaMask mode — can't programmatically switch, but we can connect directly
      connectDirectAccount(acct);
    }
  };

  const handleAccountsChanged = async (acc, web3) => {
    if (acc) {
      setAccount(acc);

      // Set default account for send() calls
      web3.eth.defaultAccount = acc;

      const contractInstance = new web3.eth.Contract(
        CredentialArtifact.abi,
        config.contractAddress
      );
      setContract(contractInstance);

      try {
        const adminAddress = await contractInstance.methods.admin().call();
        const isAdminUser = adminAddress.toLowerCase() === acc.toLowerCase();
        setIsAdmin(isAdminUser);
        setRoleLabel(isAdminUser ? 'Admin' : 'Student');
      } catch (err) {
        console.error("Error checking admin role:", err);
        setIsAdmin(false);
        setRoleLabel('Unknown');
      }
    } else {
      setAccount(null);
      setContract(null);
      setIsAdmin(false);
      setRoleLabel('Guest');
    }
  };

  const truncateAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const isCorrectNetwork = chainId === 31337 || chainId === 1337;

  const getRoleBadgeClass = () => {
    if (roleLabel === 'Admin') return 'badge badge-role-admin';
    if (roleLabel === 'Student') return 'badge badge-role-student';
    return 'badge badge-role-guest';
  };

  return (
    <div className="app-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-brand">
          <div className="navbar-logo">🎓</div>
          <div>
            <div className="navbar-title">CredChain</div>
            <div className="navbar-subtitle">University Credential Verification</div>
          </div>
        </div>
        {account && (
          <div className="status-badges">
            <span className={`badge badge-network ${!isCorrectNetwork ? 'badge-network-wrong' : ''}`}>
              <span className="badge-dot"></span>
              {isCorrectNetwork ? `Chain ${chainId}` : 'Wrong Network'}
            </span>
            <span className={getRoleBadgeClass()}>
              {roleLabel === 'Admin' ? '🛡️' : '📚'} {roleLabel}
            </span>
          </div>
        )}
      </nav>

      {/* Main Content */}
      {!account ? (
        <div className="hero-section">
          <div className="hero-icon">🔗</div>
          <h1>Credential Verification DApp</h1>
          <p className="hero-description">
            Issue, manage, and verify university credentials securely on the Ethereum blockchain.
            Connect your wallet to get started.
          </p>
          <button className="hero-btn" onClick={connectWallet} disabled={connecting}>
            <span className="btn-icon">{window.ethereum ? '🦊' : '🔌'}</span>
            {connecting ? 'Connecting...' : (window.ethereum ? 'Connect MetaMask' : 'Connect to Local Node')}
          </button>

          {error && (
            <div className="error-toast">⚠️ {error}</div>
          )}

          <div className="hero-features">
            <div className="hero-feature">
              <div className="hero-feature-icon">🔒</div>
              Tamper-proof
            </div>
            <div className="hero-feature">
              <div className="hero-feature-icon">⚡</div>
              Instant Verify
            </div>
            <div className="hero-feature">
              <div className="hero-feature-icon">🌐</div>
              Decentralized
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Connected Wallet Bar */}
          <div className="connected-header">
            <div className="wallet-info">
              <div className="wallet-avatar">👤</div>
              <div className="wallet-details">
                <span className="wallet-address">{truncateAddress(account)}</span>
                <span className="wallet-label">Connected Wallet</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {error && (
                <div className="error-toast">⚠️ {error}</div>
              )}

              {/* Account Switcher */}
              <div className="account-switcher-wrapper">
                <button
                  className="btn-secondary switcher-btn"
                  onClick={() => setShowSwitcher(!showSwitcher)}
                >
                  🔄 Switch Account
                </button>

                {showSwitcher && (
                  <div className="account-switcher-dropdown">
                    <div className="switcher-header">Hardhat Test Accounts</div>
                    {HARDHAT_ACCOUNTS.map((acct, i) => {
                      const isActive = account?.toLowerCase() === acct.address.toLowerCase();
                      return (
                        <button
                          key={i}
                          className={`switcher-account ${isActive ? 'switcher-account-active' : ''}`}
                          onClick={() => switchToAccount(acct)}
                          disabled={isActive}
                        >
                          <div className="switcher-account-info">
                            <span className="switcher-account-label">{acct.label}</span>
                            <span className="switcher-account-addr">{truncateAddress(acct.address)}</span>
                          </div>
                          {isActive && <span className="switcher-active-dot">●</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dashboard */}
          <div className="dashboard-section">
            {isAdmin ? (
              <AdminDashboard contract={contract} account={account} />
            ) : (
              <StudentDashboard contract={contract} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
