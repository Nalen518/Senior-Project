import Link from 'next/link';
import { SupportBar } from '@/components/UI/SupportBar';

export const  Not_found =() => {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden bg-white font-sans">

      <div className="absolute top-[-5%] left-[-5%] w-64 h-64 bg-tint rounded-full opacity-80" />
      <div className="absolute top-[10%] right-[10%] w-32 h-32 bg-[#D5C6E0] rounded-full opacity-80" />
      <div className="absolute bottom-[20%] left-[5%] w-36 h-36 bg-[#DF9D8D] rounded-full opacity-80" />
      <div className="absolute bottom-[-10%] right-[-5%] w-80 h-80 bg-[#E9DDB8] rounded-full opacity-80" />

      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-2xl mt-16">
        
        <div className="mb-6">
          <svg
            width="64"
            height="64"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="32" cy="32" r="32" fill="#EADFC8" />
            <circle cx="22" cy="26" r="3.5" stroke="#333" strokeWidth="1.5" />
            <circle cx="42" cy="26" r="3.5" stroke="#333" strokeWidth="1.5" />
            <line x1="26" y1="42" x2="38" y2="42" stroke="#333" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>

        <h1 className="title-page text-ink mb-4">
          This page does not exist
        </h1>
        <p className="text-muted text-base md:text-lg mb-10">
          The link may be old or typed wrong. Your check-ins are not affected.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mb-24">
          <Link 
            href="/checkin" 
            className="inline-flex min-h-12 items-center rounded-btn bg-primary px-6 text-[19px] font-bold text-white transition-colors hover:bg-primary-hover"
          >
            Start today’s check-in
          </Link>
          <Link 
            href="/support" 
            className="inline-flex min-h-12 items-center rounded-btn bg-accent px-6 text-[19px] font-bold text-ink transition-colors hover:bg-accent-hover"
          >
            See support contacts
          </Link>
        </div>

        <div className="w-full max-w-[720px]">
          <SupportBar />
        </div>
      </div>
    </div>
  );
}