import { AUTH_CONTENT } from '@/config/content/auth';

export function CourtPanel() {
  return (
    <aside
      className="relative hidden overflow-hidden bg-ivory min-[900px]:block"
      aria-label="PikolScore highlights"
    >
      <div className="px-[72px] pt-[104px]">
        <svg width="40" height="32" viewBox="0 0 40 32" fill="#8A9B82" aria-hidden="true">
          <path d="M0 32V16C0 6 5 1 14 0v7c-4 1-6 4-6 8h6v17zM22 32V16c0-10 5-15 14-16v7c-4 1-6 4-6 8h6v17z" />
        </svg>
        <p className="mt-5 text-[30px] leading-[40px] font-semibold tracking-[-0.01em] text-dark-teal">
          {AUTH_CONTENT.courtPanel.quote}
        </p>
        <div className="mt-6 flex items-center gap-2.5 text-[15px] font-medium text-deep-green">
          <span className="h-2.5 w-2.5 rounded-full bg-cream ring-[1.5px] ring-teal" />
          {AUTH_CONTENT.courtPanel.attribution}
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-[-6px]">
        <svg
          className="block h-auto w-full"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 25 572 385"
          role="img"
          aria-label="Animated pickleball rally on a court"
        >
          <style>{`
            .dust { fill: none; stroke: #FEECD6; stroke-width: 2.5; opacity: 0; }
            @media (prefers-reduced-motion: no-preference) {
              .anim-ground { animation: rally-ground 8s linear infinite; }
              .anim-height { animation: rally-height 8s linear infinite; }
              .anim-shadow { animation: rally-shadow 8s linear infinite; }
              .anim-squash { animation: rally-squash 8s linear infinite; }
              .anim-spin { animation: rally-spin 8s linear infinite; }
              .anim-net { animation: net-wobble 8s linear infinite; }
              .anim-dust-1 { animation: dust-1 8s linear infinite; }
              .anim-dust-2 { animation: dust-2 8s linear infinite; }
              .anim-dust-3 { animation: dust-3 8s linear infinite; }
            }
            @keyframes rally-ground {
              0% { transform: translate(285px, 290px); }
              18.75% { transform: translate(387px, 212px); }
              37.5% { transform: translate(140px, 245px); }
              52.5% { transform: translate(267px, 152px); }
              71.25% { transform: translate(285px, 290px); }
              74% { transform: translate(285px, 290px); }
              76.5% { transform: translate(285px, 290px); }
              78% { transform: translate(285px, 290px); }
              100% { transform: translate(285px, 290px); }
            }
            @keyframes rally-height {
              0% { transform: translateY(0px); animation-timing-function: cubic-bezier(0.2, 0.6, 0.4, 1); }
              9.375% { transform: translateY(-78px); animation-timing-function: cubic-bezier(0.6, 0, 0.8, 0.4); }
              18.75% { transform: translateY(0px); animation-timing-function: cubic-bezier(0.2, 0.6, 0.4, 1); }
              28.125% { transform: translateY(-60px); animation-timing-function: cubic-bezier(0.6, 0, 0.8, 0.4); }
              37.5% { transform: translateY(-20px); animation-timing-function: cubic-bezier(0.2, 0.6, 0.4, 1); }
              45% { transform: translateY(-55px); animation-timing-function: cubic-bezier(0.6, 0, 0.8, 0.4); }
              52.5% { transform: translateY(0px); animation-timing-function: cubic-bezier(0.2, 0.6, 0.4, 1); }
              61.875% { transform: translateY(-70px); animation-timing-function: cubic-bezier(0.6, 0, 0.8, 0.4); }
              71.25% { transform: translateY(0px); animation-timing-function: cubic-bezier(0.2, 0.6, 0.4, 1); }
              73.5% { transform: translateY(-15px); animation-timing-function: cubic-bezier(0.6, 0, 0.8, 0.4); }
              75.5% { transform: translateY(0px); animation-timing-function: cubic-bezier(0.2, 0.6, 0.4, 1); }
              77% { transform: translateY(-5px); animation-timing-function: cubic-bezier(0.6, 0, 0.8, 0.4); }
              78.5% { transform: translateY(0px); animation-timing-function: ease-in-out; }
              85% { transform: translateY(-1.5px); animation-timing-function: ease-in-out; }
              92% { transform: translateY(0px); animation-timing-function: ease-in-out; }
              97% { transform: translateY(-0.5px); animation-timing-function: ease-in-out; }
              100% { transform: translateY(0px); }
            }
            @keyframes rally-shadow {
              0% { transform: scale(1); opacity: 0.35; animation-timing-function: cubic-bezier(0.2, 0.6, 0.4, 1); }
              9.375% { transform: scale(0.4); opacity: 0.1; animation-timing-function: cubic-bezier(0.6, 0, 0.8, 0.4); }
              18.75% { transform: scale(1); opacity: 0.35; animation-timing-function: cubic-bezier(0.2, 0.6, 0.4, 1); }
              28.125% { transform: scale(0.5); opacity: 0.15; animation-timing-function: cubic-bezier(0.6, 0, 0.8, 0.4); }
              37.5% { transform: scale(0.85); opacity: 0.28; animation-timing-function: cubic-bezier(0.2, 0.6, 0.4, 1); }
              45% { transform: scale(0.55); opacity: 0.18; animation-timing-function: cubic-bezier(0.6, 0, 0.8, 0.4); }
              52.5% { transform: scale(1); opacity: 0.35; animation-timing-function: cubic-bezier(0.2, 0.6, 0.4, 1); }
              61.875% { transform: scale(0.45); opacity: 0.12; animation-timing-function: cubic-bezier(0.6, 0, 0.8, 0.4); }
              71.25% { transform: scale(1); opacity: 0.35; animation-timing-function: cubic-bezier(0.2, 0.6, 0.4, 1); }
              73.5% { transform: scale(0.7); opacity: 0.2; animation-timing-function: cubic-bezier(0.6, 0, 0.8, 0.4); }
              75.5% { transform: scale(1); opacity: 0.35; animation-timing-function: cubic-bezier(0.2, 0.6, 0.4, 1); }
              77% { transform: scale(0.9); opacity: 0.3; animation-timing-function: cubic-bezier(0.6, 0, 0.8, 0.4); }
              78.5% { transform: scale(1); opacity: 0.35; animation-timing-function: linear; }
              100% { transform: scale(1); opacity: 0.35; }
            }
            @keyframes rally-squash {
              0%, 17.5% { transform: scale(1, 1); }
              18.75% { transform: scale(1.15, 0.85); }
              19.5% { transform: scale(0.95, 1.05); }
              20.5%, 51.5% { transform: scale(1, 1); }
              52.5% { transform: scale(1.15, 0.85); }
              53.25% { transform: scale(0.95, 1.05); }
              54.25%, 70.25% { transform: scale(1, 1); }
              71.25% { transform: scale(1.15, 0.85); }
              72% { transform: scale(0.95, 1.05); }
              73%, 100% { transform: scale(1, 1); }
            }
            @keyframes rally-spin {
              0% { transform: rotate(0deg); }
              18.75% { transform: rotate(360deg); }
              37.5% { transform: rotate(720deg); }
              52.5% { transform: rotate(1080deg); }
              71.25% { transform: rotate(1440deg); }
              100% { transform: rotate(1440deg); }
            }
            @keyframes net-wobble {
              0%, 7%, 12%, 26%, 31%, 43%, 48%, 60%, 65%, 100% { transform: translateY(0); }
              9.375% { transform: translateY(-1.5px); }
              28.125% { transform: translateY(-1.5px); }
              45% { transform: translateY(-1.5px); }
              61.875% { transform: translateY(-1.5px); }
            }
            @keyframes dust-1 {
              0%, 18% { transform: scale(0.2); opacity: 0; }
              18.75% { transform: scale(0.5); opacity: 0.7; }
              22% { transform: scale(1.8); opacity: 0; }
              100% { transform: scale(1.8); opacity: 0; }
            }
            @keyframes dust-2 {
              0%, 51.5% { transform: scale(0.2); opacity: 0; }
              52.5% { transform: scale(0.5); opacity: 0.7; }
              55.5% { transform: scale(1.8); opacity: 0; }
              100% { transform: scale(1.8); opacity: 0; }
            }
            @keyframes dust-3 {
              0%, 70.25% { transform: scale(0.2); opacity: 0; }
              71.25% { transform: scale(0.5); opacity: 0.7; }
              74.5% { transform: scale(1.8); opacity: 0; }
              100% { transform: scale(1.8); opacity: 0; }
            }
          `}</style>
          <g id="court">
            <polygon points="15,238 262,58 540,203 290,383" fill="#E2E5DC" transform="translate(0, 15)" />
            <polygon points="15,238 262,58 540,203 290,383" fill="#8A9B82" />
            <polygon points="55,232 265,80 500,203 290,357" fill="#0F5C62" />
            <polygon points="155,160 395,280 385,285 145,165" fill="#8A9B82" />
            <g stroke="#FEECD6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="55,232 265,80 500,203 290,357" fill="none" />
              <line x1="197" y1="129" x2="432" y2="253" />
              <line x1="123" y1="183" x2="358" y2="307" />
              <line x1="314.5" y1="191" x2="382.5" y2="141.5" />
              <line x1="240.5" y1="245" x2="172.5" y2="294.5" />
            </g>
          </g>
          <g id="dust-layer">
            <g transform="translate(387, 212)">
              <ellipse cx="0" cy="0" rx="12" ry="6" className="dust anim-dust-1" style={{ transformOrigin: '0 0' }} />
            </g>
            <g transform="translate(267, 152)">
              <ellipse cx="0" cy="0" rx="12" ry="6" className="dust anim-dust-2" style={{ transformOrigin: '0 0' }} />
            </g>
            <g transform="translate(285, 290)">
              <ellipse cx="0" cy="0" rx="12" ry="6" className="dust anim-dust-3" style={{ transformOrigin: '0 0' }} />
            </g>
          </g>
          <g id="net" className="anim-net">
            <polygon points="152,120 422,265 422,300 152,155" fill="#084B46" opacity="0.6" />
            <line x1="152" y1="120" x2="422" y2="265" stroke="#FEECD6" strokeWidth="3" strokeLinecap="round" />
            <path
              d="M 179,134 L 179,169 M 206,149 L 206,184 M 233,163 L 233,198 M 260,178 L 260,213 M 287,192 L 287,227 M 314,207 L 314,242 M 341,221 L 341,256 M 368,236 L 368,271 M 395,250 L 395,285"
              stroke="#8A9B82"
              strokeWidth="0.75"
              opacity="0.5"
            />
            <line x1="152" y1="110" x2="152" y2="168" stroke="#203F39" strokeWidth="5" strokeLinecap="round" />
            <line x1="422" y1="255" x2="422" y2="313" stroke="#203F39" strokeWidth="5" strokeLinecap="round" />
          </g>
          <g className="anim-ground" transform="translate(285, 290)">
            <ellipse cx="0" cy="0" rx="10" ry="5" fill="#203F39" className="anim-shadow" style={{ transformOrigin: '0px 0px' }} />
            <g className="anim-height">
              <g className="anim-squash" style={{ transformOrigin: '0px 0px' }}>
                <g className="anim-spin" style={{ transformOrigin: '0px 0px' }}>
                  <circle cx="0" cy="0" r="10" fill="#FEECD6" />
                  <circle cx="-3" cy="-3" r="1.5" fill="#748079" />
                  <circle cx="4" cy="-1" r="1.5" fill="#748079" />
                  <circle cx="0" cy="4" r="1.5" fill="#748079" />
                </g>
              </g>
            </g>
          </g>
        </svg>
      </div>
    </aside>
  );
}

export default CourtPanel;
