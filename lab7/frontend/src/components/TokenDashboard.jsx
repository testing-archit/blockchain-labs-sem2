import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Send, Key, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../utils/contract';
import { getBalanceOf, transferTokens } from '../utils/erc20_functions.js';

export default function TokenDashboard({ account, provider }) {
  const [balance, setBalance] = useState('0');
  const [symbol, setSymbol] = useState('');
  const [contract, setContract] = useState(null);

  // Transfer State
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferStatus, setTransferStatus] = useState({ type: '', msg: '' });
  const [isTransferring, setIsTransferring] = useState(false);


  useEffect(() => {
    const initContract = async () => {
      try {
        const signer = await provider.getSigner();
        const tokenContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        setContract(tokenContract);
        
        const tokenSymbol = await tokenContract.symbol();
        setSymbol(tokenSymbol);
        
        await fetchBalance(tokenContract);
      } catch (error) {
        console.error("Error initializing contract:", error);
      }
    };

    if (provider && account) {
      initContract();
    }
  }, [provider, account]);

  const fetchBalance = async (tokenContract) => {
    try {
      const bal = await getBalanceOf(tokenContract, account);
      setBalance(ethers.formatUnits(bal, 18));
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!transferTo || !transferAmount) return;

    try {
      setIsTransferring(true);
      setTransferStatus({ type: '', msg: '' });
      
      // transferTokens handles parsing
      const tx = await transferTokens(contract, transferTo, transferAmount);
      
      setTransferStatus({ type: 'loader', msg: 'Transaction pending...' });
      
      await tx.wait();
      
      setTransferStatus({ type: 'success', msg: 'Transfer successful!' });
      setTransferTo('');
      setTransferAmount('');
      fetchBalance(contract);
      
      setTimeout(() => setTransferStatus({ type: '', msg: '' }), 5000);
    } catch (error) {
      console.error(error);
      setTransferStatus({ type: 'error', msg: error.reason || 'Transfer failed' });
    } finally {
      setIsTransferring(false);
    }
  };


  const StatusMessage = ({ status }) => {
    if (!status.msg) return null;
    return (
      <div className={`status ${status.type === 'error' ? 'error' : 'success'}`}>
        {status.type === 'error' && <AlertCircle size={18} />}
        {status.type === 'success' && <CheckCircle size={18} />}
        {status.type === 'loader' && <Loader2 size={18} className="spin" />}
        <span>{status.msg}</span>
      </div>
    );
  };

  return (
    <div className="dashboard-grid">
      <div className="glass-panel balance-card">
        <h2 className="balance-label">Your Balance</h2>
        <div className="balance-amount gradient-text">
          {Number(balance).toLocaleString(undefined, { maximumFractionDigits: 4 })}
        </div>
        <div className="text-muted" style={{ fontSize: '24px', fontWeight: 500 }}>{symbol}</div>
      </div>

      <div className="glass-panel">
        <div className="flex items-center gap-2 mb-6">
          <Send className="gradient-text" size={24} />
          <h2>Transfer {symbol}</h2>
        </div>
        
        <StatusMessage status={transferStatus} />

        <form onSubmit={handleTransfer}>
          <div className="form-group">
            <label>Recipient Address</label>
            <div className="input-wrapper">
              <input
                type="text"
                placeholder="0x..."
                value={transferTo}
                onChange={(e) => setTransferTo(e.target.value)}
                disabled={isTransferring}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Amount ({symbol})</label>
            <div className="input-wrapper">
              <input
                type="number"
                step="any"
                min="0"
                placeholder="0.0"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                disabled={isTransferring}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-full mt-4"
            disabled={isTransferring || !transferTo || !transferAmount}
          >
            {isTransferring ? (
              <><Loader2 size={18} className="spin" /> Processing...</>
            ) : (
              <><Send size={18} /> Send Tokens</>
            )}
          </button>
        </form>
      </div>


    </div>
  );
}
