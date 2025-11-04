'use client';

import { useState, useRef, useEffect } from 'react';

interface TermsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function TermsModal({ isOpen, onClose }: TermsModalProps) {
    const [scrolledToEnd, setScrolledToEnd] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleScroll = () => {
            if (contentRef.current) {
                const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
                if (scrollTop + clientHeight >= scrollHeight - 10) {
                    setScrolledToEnd(true);
                }
            }
        };

        if (contentRef.current) {
            contentRef.current.addEventListener('scroll', handleScroll);
            return () => {
                contentRef.current?.removeEventListener('scroll', handleScroll);
            };
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="terms-modal" onClick={onClose}>
            <div className="terms-modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>Terms and Conditions</h2>

                <div className="terms-content" ref={contentRef}>
                    <p>
                        Welcome to <strong>Smart Fish Care</strong>! By using this application, you agree to
                        the following terms and conditions:
                    </p>
                    <br />

                    <h3>1. Acceptance of Terms</h3>
                    <p>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;-&nbsp;&nbsp;Your access to and use of the app is
                        conditioned upon your acceptance of and compliance with these Terms. These Terms apply
                        to all visitors, users, and others who access or use the app.
                    </p>
                    <br />

                    <h3>2. User Responsibilities</h3>
                    <p>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;-&nbsp;&nbsp;You agree not to misuse the app or help
                        anyone else to do so. This includes not interfering with the app&apos;s operations,
                        accessing data you are not authorised to, or attempting to disrupt the app&apos;s
                        services.
                    </p>
                    <br />

                    <h3>3. Privacy Policy</h3>
                    <p>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;-&nbsp;&nbsp;By using this app, you also agree to the
                        terms outlined in our Privacy Policy regarding how your data is collected, processed,
                        and stored.
                    </p>
                    <br />

                    <h3>4. Modifications to Terms</h3>
                    <p>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;-&nbsp;&nbsp;We reserve the right to modify these Terms
                        at any time. Your continued use of the app following any changes indicates your
                        acceptance of the updated Terms.
                    </p>
                    <br />

                    <h3>5. Limitation of Liability</h3>
                    <p>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;-&nbsp;&nbsp;We are not liable for any damages or losses
                        resulting from your use of the app. The app is provided on an &apos;as-is&apos; and
                        &apos;as-available&apos; basis.
                    </p>
                    <br />

                    <h3>6. Governing Law</h3>
                    <p>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;-&nbsp;&nbsp;These Terms shall be governed and construed
                        in accordance with the laws of the Philippines, without regard to its conflict of law
                        provisions.
                    </p>
                    <br />
                    <br />
                    <br />

                    <p>
                        <h2>Privacy Policy</h2>
                    </p>
                    <p>
                        The Data Privacy Act of 2012 in the Philippines regulates how personal data is
                        collected, processed, and stored.
                    </p>
                    <br />
                    <br />
                    This law ensures that individuals have control over their personal information and
                    provides them with specific rights to safeguard their privacy. These rights include:
                    <br />

                    <h3>1. The Right to Be Informed</h3>
                    <p>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;-&nbsp;&nbsp;Data subjects should be informed that their
                        personal data will be collected, processed, and stored. This includes information about
                        the purpose of data collection, the categories of personal data being collected, the
                        recipients or categories of recipients who may have access to the data, and the period
                        for which the data will be stored. Consent should be obtained when necessary.
                    </p>
                    <br />

                    <h3>2. The Right to Access</h3>
                    <p>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;-&nbsp;&nbsp;Data subjects have the right to obtain a
                        copy of the personal information that an organisation may possess about them. They can
                        request organisations to do this, as well as additional details about how the data is
                        being used or processed. Organisations must respond to these requests within a
                        reasonable timeframe, usually within 30 days, and ensure that the information is
                        provided in a clear and understandable format.
                    </p>
                    <br />

                    <h3>3. The Right to Object</h3>
                    <p>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;-&nbsp;&nbsp;Data subjects can object to processing if it
                        is based on consent or legitimate business interest.
                    </p>
                    <br />

                    <h3>4. The Right to Erasure or Blocking</h3>
                    <p>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;-&nbsp;&nbsp;Data subjects have the right to withdraw or
                        order the removal of their personal data when their rights are violated.
                    </p>
                    <br />

                    <h3>5. The Right to Damages</h3>
                    <p>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;-&nbsp;&nbsp;Data subjects can claim compensation for
                        damages due to unlawfully obtained or unauthorised use of personal data.
                    </p>
                    <br />

                    <p>
                        The <strong>Data Privacy Act</strong> also ensures that the Philippines complies with
                        international data protection standards.
                    </p>
                    <br />
                </div>

                <button
                    id="acceptTermsBtn"
                    className="terms-button"
                    disabled={!scrolledToEnd}
                    onClick={onClose}
                >
                    I Agree
                </button>
            </div>
            <style jsx>{`
        .terms-modal {
          display: flex;
          position: fixed;
          z-index: 2000;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.7);
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .terms-modal-content {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          padding: 30px;
          border-radius: 20px;
          width: 90%;
          max-width: 700px;
          max-height: 90vh;
          position: relative;
          color: #e6e9ef;
          display: flex;
          flex-direction: column;
        }

        .terms-modal-content h2 {
          margin-bottom: 20px;
          color: #e6e9ef;
          text-align: center;
        }

        .terms-content {
          flex: 1;
          overflow-y: auto;
          padding-right: 10px;
          margin-bottom: 20px;
        }

        .terms-content h3 {
          color: #7c5cff;
          margin-top: 20px;
        }

        .terms-content p {
          color: #a2a8b6;
          line-height: 1.6;
        }

        .terms-button {
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, #7c5cff, #4cc9f0);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .terms-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(124, 92, 255, 0.4);
        }

        .terms-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
        </div>
    );
}

