import React, { useState, useEffect } from 'react';
import Lenis from 'lenis';
import Navbar from './navbar';
import Footer from './footer';
import DialogueBox from './box/dialoguebox';
import './faq.css';

interface FaqItem {
  id: number;
  category: 'zkp' | 'gasless' | 'security' | 'general';
  question: string;
  answer: string;
}

const FAQ_DATA: FaqItem[] = [
  {
    id: 1,
    category: 'gasless',
    question: 'Do voters need cryptocurrency or an Ethereum wallet?',
    answer: 'No. TrueVote is designed for maximum accessibility. We utilize EIP-712 meta-transactions and dedicated gas relayers so voters can cast verifiable ballots directly from any modern web browser without paying gas fees or installing MetaMask.'
  },
  {
    id: 2,
    category: 'zkp',
    question: 'How does Zero-Knowledge protect my vote privacy?',
    answer: 'Zero-Knowledge proofs (zk-SNARKs) allow our cryptographic circuits to mathematically prove that you are an authorized, registered voter on the electoral roll without ever disclosing who you are, your credentials, or which candidate you selected.'
  },
  {
    id: 3,
    category: 'security',
    question: 'Can election administrators or organizers tamper with results?',
    answer: 'No. Every cast ballot is cryptographically committed on the Ethereum blockchain and pinned to decentralized IPFS storage. Once an election is launched, the smart contract deterministically computes tallies, making post-facto modification or deletion impossible.'
  },
  {
    id: 4,
    category: 'zkp',
    question: 'How does TrueVote prevent double-voting if ballots are anonymous?',
    answer: 'TrueVote generates a unique mathematical "nullifier" hash for each voter during proof creation. When a vote is cast, this nullifier is recorded in the smart contract. Any subsequent attempt to vote generates the identical nullifier and is immediately rejected, preserving voter anonymity while guaranteeing one vote per person.'
  },
  {
    id: 5,
    category: 'security',
    question: 'Can independent auditors verify the final election outcome?',
    answer: 'Yes. All ballot commitments, verification keys, and IPFS CIDs are completely transparent. Anyone in the world can run an independent audit node to mathematically verify that every vote tallied corresponds to a valid proof without decrypting individual voter ballots.'
  },
  {
    id: 6,
    category: 'zkp',
    question: 'What cryptographic circuit does TrueVote use for zk-SNARKs?',
    answer: 'TrueVote utilizes Groth16 zk-SNARK circuits compiled with Circom and SnarkJS. Proof generation takes less than 2.8 seconds on standard modern mobile devices and laptops, and on-chain verification consumes under 250,000 gas on Ethereum EVM.'
  },
  {
    id: 7,
    category: 'security',
    question: 'How are voter identities and registries kept secure off-chain?',
    answer: 'Eligible voter public keys are structured into an off-chain Merkle tree. Only the cryptographic Merkle root is posted to the Ethereum smart contract. No personally identifiable information (PII) is ever written to the blockchain.'
  },
  {
    id: 8,
    category: 'general',
    question: 'How does Pinata IPFS ensure decentralized file resilience?',
    answer: 'Election manifests, candidate metadata, and cryptographic parameters are pinned across redundant IPFS nodes via Pinata. The resulting immutable Content Identifiers (CIDs) prevent any central server failure or censorship attempts.'
  }
];

export const FaqPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [isHackathonModalOpen, setIsHackathonModalOpen] = useState<boolean>(false);

  useEffect(() => {
    document.title = 'FAQ | TrueVote - Zero-Knowledge Governance';
    window.scrollTo(0, 0);

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      touchMultiplier: 2,
    });

    (window as any).lenis = lenis;

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    const animTimer = setTimeout(() => {
      const elements = document.querySelectorAll('.faq-page-main .blur-animate');
      elements.forEach((el) => el.classList.add('visible'));
    }, 50);

    return () => {
      clearTimeout(animTimer);
      cancelAnimationFrame(rafId);
      if (typeof (window as any).lenis?.destroy === 'function') {
        (window as any).lenis.destroy();
      }
      (window as any).lenis = null;
    };
  }, []);

  const toggleFaq = (id: number) => {
    setOpenFaqIndex((prev) => (prev === id ? null : id));
  };

  const filteredFaqs = FAQ_DATA.filter((item) => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="faq-page-wrapper">
      <Navbar />

      <main className="faq-page-main">
        {/* Header Hero */}
        <section className="faq-hero-container">
          <div className="faq-pill-badge blur-animate">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>FAQ & Knowledge Base</span>
          </div>

          <h1 className="faq-main-title blur-animate delay-1">
            Frequently Asked <br />
            <span className="serif-italic-accent" style={{ color: '#1d6bf3' }}>Questions</span>
          </h1>

          <p className="faq-main-sub blur-animate delay-2">
            Everything you need to know about TrueVote's zero-knowledge voting protocol, gasless relayer infrastructure, and cryptographic election integrity.
          </p>

          {/* Search Input */}
          <div className="faq-search-box blur-animate delay-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input 
              type="text"
              className="faq-search-input"
              placeholder="Search by keyword, e.g. 'nullifier', 'gasless', 'merkle'..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                type="button" 
                className="faq-search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="faq-filter-pills blur-animate delay-3">
            {[
              { id: 'all', label: 'All Questions' },
              { id: 'zkp', label: 'Zero-Knowledge & Privacy' },
              { id: 'gasless', label: 'Gasless & Relayers' },
              { id: 'security', label: 'Security & Verification' },
              { id: 'general', label: 'Decentralized IPFS' }
            ].map((filter) => (
              <button
                key={filter.id}
                type="button"
                className={`faq-filter-pill ${activeCategory === filter.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </section>

        {/* FAQ Accordion List */}
        <section className="faq-content-section blur-animate delay-4">
          {filteredFaqs.length > 0 ? (
            <div className="faq-accordion-list">
              {filteredFaqs.map((item) => (
                <div 
                  key={item.id} 
                  className={`faq-item ${openFaqIndex === item.id ? 'open' : ''}`}
                  onClick={() => toggleFaq(item.id)}
                >
                  <button className="faq-question" type="button">
                    <span>{item.question}</span>
                    <svg 
                      className={`faq-chevron ${openFaqIndex === item.id ? 'rotated' : ''}`} 
                      width="18" 
                      height="18" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2.2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {openFaqIndex === item.id && (
                    <div className="faq-answer">
                      <p>{item.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="faq-empty-state">
              <p>No questions matched your search: "<strong>{searchQuery}</strong>"</p>
              <button 
                type="button" 
                className="faq-reset-btn"
                onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
              >
                Reset Search
              </button>
            </div>
          )}
        </section>

        {/* Bottom Help Banner */}
        <section className="faq-help-banner blur-animate delay-5">
          <div className="faq-help-card">
            <div className="faq-help-icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div className="faq-help-text">
              <h3>Have additional technical questions?</h3>
              <p>Explore the architecture specs in our Hackathon Prototype dialogue or connect with the core architect.</p>
            </div>
            <div className="faq-help-actions">
              <button 
                type="button" 
                className="faq-help-btn-primary"
                onClick={() => setIsHackathonModalOpen(true)}
              >
                Hackathon Specs
              </button>
              <a href="/team" className="faq-help-btn-secondary">
                Meet the Builders →
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer onOpenHackathon={() => setIsHackathonModalOpen(true)} />

      <DialogueBox 
        isOpen={isHackathonModalOpen} 
        onClose={() => setIsHackathonModalOpen(false)} 
      />
    </div>
  );
};

export default FaqPage;
