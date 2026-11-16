import Link from 'next/link';

export const Hero= () => {
  return (
    <div className="relative flex flex-col items-center min-h-screen overflow-hidden bg-white font-sans py-20">
      {/* Background Decorative Shapes */}
      <div className="absolute top-[5%] left-[-5%] w-48 h-48 sm:w-72 sm:h-72 bg-[#DF9D8D] rounded-full opacity-80" />
      <div className="absolute top-[5%] right-[15%] w-32 h-32 bg-[#E9DDB8] rounded-full opacity-80" />
      <div className="absolute top-[15%] right-[-5%] w-48 h-48 sm:w-64 sm:h-64 bg-[#D5C6E0] rounded-full opacity-80" />
      <div className="absolute bottom-[-10%] left-[-5%] w-64 h-64 sm:w-80 sm:h-80 bg-[#E9DDB8] rounded-full opacity-80" />
      <div className="absolute bottom-[-15%] right-[-10%] w-80 h-80 sm:w-96 sm:h-96 bg-[#EAF5F5] rounded-full opacity-80" />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 w-full max-w-2xl mt-8">
        
        {/* Header Text */}
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#142B47] mb-4">
          You are not alone.
        </h1>
        <p className="text-[#4A5568] text-base md:text-lg mb-12 max-w-md mx-auto">
          It sounds like things are really heavy right now. Talking to a real person can help. You can reach someone now.
        </p>

        {/* Contact Cards */}
        <div className="w-full flex flex-col gap-4 mb-12">
          
          {/* MHERL */}
          <div className="flex items-center justify-between p-5 bg-[#EAF5F5] border border-[#D1E8E8] rounded-xl">
            <div className="text-left pr-4">
              <h2 className="text-lg md:text-xl font-serif font-bold text-[#142B47] mb-1">MHERL</h2>
              <p className="text-xs md:text-sm text-[#4A5568]">UGM mental health emergency line, 24 hours on WhatsApp</p>
            </div>
            <a 
              href="#" 
              className="px-5 py-2 bg-[#F19F65] hover:bg-[#e08e54] text-[#142B47] font-semibold rounded-md transition-colors"
            >
              Chat
            </a>
          </div>

          {/* PK4L */}
          <div className="flex items-center justify-between p-5 bg-[#EAF5F5] border border-[#D1E8E8] rounded-xl">
            <div className="text-left pr-4">
              <h2 className="text-lg md:text-xl font-serif font-bold text-[#142B47] mb-1">PK4L</h2>
              <p className="text-xs md:text-sm text-[#4A5568]">UGM campus emergency service, (0274) 649-1234</p>
            </div>
            <a 
              href="tel:02746491234" 
              className="px-5 py-2 bg-[#F19F65] hover:bg-[#e08e54] text-[#142B47] font-semibold rounded-md transition-colors"
            >
              Call
            </a>
          </div>

          {/* Healing119 */}
          <div className="flex items-center justify-between p-5 bg-[#EAF5F5] border border-[#D1E8E8] rounded-xl">
            <div className="text-left pr-4">
              <h2 className="text-lg md:text-xl font-serif font-bold text-[#142B47] mb-1">Healing119</h2>
              <p className="text-xs md:text-sm text-[#4A5568]">National support line from the Ministry of Health</p>
            </div>
            <a 
              href="#" 
              className="px-5 py-2 bg-[#F19F65] hover:bg-[#e08e54] text-[#142B47] font-semibold rounded-md transition-colors"
            >
              Open
            </a>
          </div>

        </div>

        {/* Disclaimer Text */}
        <p className="text-[#142B47] text-sm md:text-base font-medium mb-4 max-w-lg mx-auto">
          If you are in immediate danger, call local emergency services or go to the nearest hospital.
        </p>
        <p className="text-[#718096] text-xs md:text-sm mb-10">
          Your check-in is saved. No AI insight is shown here.
        </p>

        {/* Back Button */}
        <Link 
          href="/mindmeter"
          className="px-6 py-2.5 bg-white border border-[#CBD5E0] hover:bg-gray-50 text-[#142B47] font-semibold rounded-md shadow-sm transition-colors"
        >
          Back to MindMeter
        </Link>
      </div>
    </div>
  );
}