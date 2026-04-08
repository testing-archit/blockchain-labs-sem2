import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Hexagon, Wallet, LogOut, ShieldAlert } from 'lucide-react';
import TokenDashboard from './components/TokenDashboard';

export default function App() {
  const [account, setAccount] = useState('');
  const [provider, setProvider] = useState(null);
  const [error, setError] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          setAccount('');
          setProvider(null);
        }
      });
      
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners();
      }
    };
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('MetaMask is not installed. Please install it to use this app.');
      return;
    }

    try {
      setIsConnecting(true);
      setError('');
      
      const provider = new ethers.BrowserProvider(window.ethereum);
       
      const network = await provider.getNetwork();
      if (network.chainId !== 11155111n) {
        // Sepolia chain ID
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }], // 11155111 in hex
          });
        } catch (switchError) {
          setError('Please switch to the Sepolia testnet in MetaMask manually.');
          setIsConnecting(false);
          return;
        }
      }

      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      setProvider(provider);
      setAccount(address);
    } catch (err) {
      console.error(err);
      setError('Failed to connect wallet: ' + (err.message || 'Unknown error'));
    } finally {
      setIsConnecting(false);
    }
  };

  const switchAccount = async () => {
    if (!window.ethereum) return;
    
    try {
      setIsConnecting(true);
      // Requesting permissions forces the MetaMask account selection popup
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }],
      });
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      setAccount(address);
      setProvider(provider);
    } catch (err) {
      console.error(err);
      if (err.code !== 4001) { // 4001 is user rejection
        setError('Failed to switch account: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const formatAddress = (addr) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div className="app-container">
      <header>
        <div className="logo-section">
          <div className="logo-icon">
            <Hexagon size={24} />
          </div>
          <h1 className="gradient-text">ArchitToken</h1>
        </div>

        {account ? (
          <div className="flex items-center gap-3">
            <div className="glass-panel" style={{ padding: '8px 16px', borderRadius: '12px' }}>
              <span className="text-sm font-semibold">{formatAddress(account)}</span>
            </div>
            <button 
              className="btn btn-secondary-outline" 
              onClick={switchAccount}
              disabled={isConnecting}
              title="Switch Account"
              style={{ padding: '8px', borderRadius: '12px' }}
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <button 
            className="btn btn-primary" 
            onClick={connectWallet}
            disabled={isConnecting}
          >
            {isConnecting ? 'Connecting...' : <><Wallet size={18} /> Connect Wallet</>}
          </button>
        )}
      </header>

      <main>
        {error && (
          <div className="status error" style={{ maxWidth: '600px', margin: '0 auto 32px' }}>
            <ShieldAlert size={20} />
            {error}
          </div>
        )}

        {account && provider ? (
          <TokenDashboard account={account} provider={provider} />
        ) : (
          <div className="connect-prompt glass-panel">
            <div className="connect-icon-wrapper">
              <Hexagon size={48} />
            </div>
            <h2>Welcome to ArchitToken DApp</h2>
            <p>Connect your MetaMask wallet to check your AT balance, transfer tokens, and manage allowances securely on the Sepolia testnet.</p>
            <button 
              className="btn btn-primary"
              onClick={connectWallet}
              style={{ padding: '16px 32px', fontSize: '18px', marginTop: '12px' }}
              disabled={isConnecting}
            >
              <Wallet size={24} /> 
              {isConnecting ? 'Waiting for MetaMask...' : 'Connect to Start'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
