"use client";

// ULTRA-MINIMAL loading skeleton
// 100% CSS animations via global styles - completely independent of React lifecycle
// No state, no effects, no re-render dependencies

const AnimatedLoadingSkeleton = () => {
    return (
        <>
            {/* Global styles - injected once, never re-rendered */}
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes skeleton-pulse {
                    0%, 100% { opacity: 0.4; }
                    50% { opacity: 0.7; }
                }
                @keyframes skeleton-shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .skel-card {
                    background: rgba(39, 39, 42, 0.4);
                    border: 1px solid rgba(63, 63, 70, 0.3);
                    border-radius: 8px;
                    padding: 16px;
                    animation: skeleton-pulse 2s ease-in-out infinite;
                }
                .skel-card:nth-child(1) { animation-delay: 0s; }
                .skel-card:nth-child(2) { animation-delay: 0.15s; }
                .skel-card:nth-child(3) { animation-delay: 0.3s; }
                .skel-card:nth-child(4) { animation-delay: 0.45s; }
                .skel-card:nth-child(5) { animation-delay: 0.6s; }
                .skel-card:nth-child(6) { animation-delay: 0.75s; }
                .skel-bar {
                    background: rgba(63, 63, 70, 0.5);
                    border-radius: 4px;
                    position: relative;
                    overflow: hidden;
                }
                .skel-bar::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent);
                    animation: skeleton-shimmer 2s ease-in-out infinite;
                }
            `}} />
            
            <div style={{
                width: '100%',
                maxWidth: '600px',
                margin: '0 auto',
                padding: '24px'
            }}>
                <div style={{
                    background: 'rgba(24, 24, 27, 0.5)',
                    border: '1px solid rgba(63, 63, 70, 0.2)',
                    borderRadius: '12px',
                    padding: '24px'
                }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '16px'
                    }}>
                        {[0,1,2,3,4,5].map(i => (
                            <div key={i} className="skel-card">
                                <div className="skel-bar" style={{ height: '80px', marginBottom: '12px' }} />
                                <div className="skel-bar" style={{ height: '10px', width: '75%', marginBottom: '8px' }} />
                                <div className="skel-bar" style={{ height: '8px', width: '50%' }} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};

export default AnimatedLoadingSkeleton;
