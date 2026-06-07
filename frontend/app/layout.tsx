import type { Metadata } from 'next';
import { DM_Sans } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { Providers } from './providers';
import { ThemePanel } from '@/components/shared/ThemePanel';

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Volunteer Vantagens',
  description: 'ConnectConference\'26 — Sistema de gestão de voluntários',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      {/* Anti-FOUC: aplica tema e modo antes do React hidratar */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            var t=localStorage.getItem('cc26-theme')||'central';
            var m=localStorage.getItem('cc26-mode')||'dark';
            document.documentElement.setAttribute('data-theme',t);
            document.documentElement.setAttribute('data-mode',m);
          })();
        ` }} />
      </head>
      <body className={`${dmSans.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
        <ThemePanel />

        <Script id="ripple" strategy="afterInteractive">{`
          (function(){
            function spawn(x,y){
              var el=document.createElement('div');
              el.style.cssText=[
                'position:fixed','left:'+x+'px','top:'+y+'px',
                'width:0','height:0','border-radius:50%',
                'border:2px solid var(--brand-primary, rgba(165,28,28,0.85))',
                'transform:translate(-50%,-50%)','pointer-events:none','z-index:99999'
              ].join(';');
              document.body.appendChild(el);
              var a=el.animate(
                [{width:'0px',height:'0px',opacity:1,borderWidth:'2px'},
                 {width:'350px',height:'350px',opacity:0,borderWidth:'1px'}],
                {duration:1200,easing:'cubic-bezier(0.1,0.8,0.3,1)',fill:'forwards'}
              );
              a.addEventListener('finish',function(){el.remove();});
            }
            var lt=0;
            document.addEventListener('touchstart',function(e){
              lt=Date.now();
              var t=e.changedTouches[0];
              if(t)spawn(t.clientX,t.clientY);
            },{passive:true});
            document.addEventListener('click',function(e){
              if(Date.now()-lt<600)return;
              spawn(e.clientX,e.clientY);
            });
          })();
        `}</Script>
      </body>
    </html>
  );
}
