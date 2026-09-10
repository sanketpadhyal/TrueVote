import React, { useState } from 'react';
import './home.css';

interface Candidate {
  id: string;
  number: string;
  name: string;
  party: string;
  votes: number;
}

export const HomePage: React.FC = () => {
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const [candidates, setCandidates] = useState<Candidate[]>([
    {
      id: '01',
      number: '01',
      name: 'John Davis',
      party: 'Progressive Party',
      votes: 1420,
    },
    {
      id: '02',
      number: '02',
      name: 'Sarah Chen',
      party: 'Community Alliance',
      votes: 1890,
    },
    {
      id: '03',
      number: '03',
      name: 'Michael Brown',
      party: 'Innovation Coalition',
      votes: 1150,
    },
  ]);

  const totalVotes = candidates.reduce((acc, curr) => acc + curr.votes, 0);

  const handleVote = (candidateId: string, candidateName: string) => {
    if (hasVoted) {
      showToast(`⚠️ Device Token Consumed: You have already cast your vote in this election.`);
      return;
    }

    setCandidates(prev =>
      prev.map(c => (c.id === candidateId ? { ...c, votes: c.votes + 1 } : c))
    );
    setHasVoted(true);
    setSelectedCandidate(candidateName);
    showToast(`✅ Vote cast successfully for ${candidateName}! Relayer processing block on-chain.`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  return (
    <div className="home-container">
      {/* Top Navbar */}
      <header className="navbar">
        <a href="/" className="logo-group">
          <div className="logo-badge">V</div>
          <span>TrueVote</span>
        </a>
        
        <ul className="nav-links">
          <li><a href="#overview" className="nav-link active">Profile</a></li>
          <li><a href="#updates" className="nav-link">Updates</a></li>
          <li><a href="#candidates" className="nav-link">Candidates</a></li>
        </ul>

        <div className="nav-actions">
          <button className="btn-pill-dark">
            <span>Sign up</span>
          </button>
          <div className="hamburger-icon">☰</div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section" id="overview">
        <div className="hero-content">
          <div className="online-vote-badge">Online Vote</div>
          
          <h1 className="hero-headline">
            Political <span className="highlight-muted">Voting</span>
          </h1>

          <p className="hero-subtext">
            TrueVote is a decentralized Web3 voting platform for secure and anonymous elections.
            Users can vote without creating an account or connecting a wallet.
          </p>

          <div className="cta-group">
            <button 
              className="btn-pill-dark"
              onClick={() => {
                const el = document.getElementById('candidates');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <span className="hand-pointer">👉</span>
              <span>let's vote...</span>
            </button>

            <button 
              className="btn-pill-outline"
              onClick={() => {
                const el = document.getElementById('candidates');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Vote now
            </button>
          </div>
        </div>

        <div className="hero-visual">
          <div className="floating-election-banner">Election Day</div>
          <div className="main-illustration-wrapper">
            <img 
              src="/images/voting_illustration.webp" 
              alt="Online Political Voting Illustration" 
              className="hero-img"
            />
          </div>
        </div>

        <div className="page-indicator">09/10</div>
      </section>

      {/* Candidates Interactive Section */}
      <section className="candidates-demo-section" id="candidates">
        <div className="section-header">
          <span className="section-tag">Decentralized Ballot</span>
          <h2 className="section-title">
            Select Your <span className="highlight-muted">Candidate</span>
          </h2>
        </div>

        <div className="candidate-cards-grid">
          {candidates.map((c) => {
            const percentage = Math.round((c.votes / totalVotes) * 100);
            return (
              <div key={c.id} className="candidate-card">
                <span className="card-number">{c.number}</span>
                <div className="candidate-avatar-badge">
                  {c.name.split(' ').map(n => n[0]).join('')}
                </div>
                
                <div className="candidate-info">
                  <h3>{c.name}</h3>
                  <p>{c.party}</p>
                </div>

                <div className="vote-tally-bar">
                  <div 
                    className="vote-tally-fill" 
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <div className="tally-stats">
                  <span>{c.votes.toLocaleString()} Votes</span>
                  <span>{percentage}%</span>
                </div>

                <button
                  className={hasVoted && selectedCandidate === c.name ? "btn-pill-blue" : "btn-pill-outline"}
                  onClick={() => handleVote(c.id, c.name)}
                >
                  {hasVoted ? (selectedCandidate === c.name ? "Voted ✓" : "Vote Now") : "Vote Now"}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Features & Cryptographic Security */}
      <section className="features-section" id="updates">
        <div className="features-container">
          <div className="security-img-container">
            <img 
              src="/images/blockchain_security.webp" 
              alt="Blockchain Security & IPFS Storage" 
            />
          </div>

          <div className="features-list">
            <div className="feature-item">
              <div className="feature-icon">🛡️</div>
              <div className="feature-content">
                <h4>Walletless Anonymous Voting</h4>
                <p>No crypto wallet or gas fees required. Anonymous browser/device tokens prevent repeat submissions without compromising voter identity.</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">⛓️</div>
              <div className="feature-content">
                <h4>Tamper-Resistant Blockchain Records</h4>
                <p>Election metadata and cryptographic commitments are anchored on EVM smart contracts and decentralized IPFS storage via Pinata.</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">🚀</div>
              <div className="feature-content">
                <h4>Automated Relayer Infrastructure</h4>
                <p>A backend relayer submits voting transactions seamlessly to provide instant confirmation for voters while maintaining public verifiability.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="vote-toast">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default HomePage;
