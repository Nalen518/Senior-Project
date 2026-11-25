import Link from "next/link";

export const Hero = () => {
  return (
    <>
      <section className="relative min-h-screen overflow-hidden bg-white px-4 pb-10 pt-24 text-[#1F3347] sm:px-6">
        <div className="pointer-events-none absolute -left-12 top-16 h-28 w-28 rounded-full bg-[#E4A79A]" />
        <div className="pointer-events-none absolute right-[28%] top-20 h-20 w-20 rounded-full bg-[#ECE1BE]" />
        <div className="pointer-events-none absolute -right-10 top-36 h-32 w-32 rounded-full bg-[#D3C1E5]" />
        <div className="pointer-events-none absolute right-12 top-[20rem] h-20 w-20 rounded-full bg-[#D3C1E5]" />
        <div className="pointer-events-none absolute -left-10 bottom-4 h-32 w-44 rounded-full bg-[#ECE1BE]" />
        <div className="pointer-events-none absolute -right-12 bottom-0 h-28 w-28 rounded-full bg-[#E3F2F1]" />

        <div className="relative mx-auto max-w-2xl">
          <header>
            <h1 className="font-serif text-3xl font-bold sm:text-4xl">
              About MindMeter
            </h1>
            <p className="mt-1 text-sm text-[#3D4D59]">
              A private daily check-in for UGM students.
            </p>
          </header>

          <div className="mt-6 space-y-6 text-sm text-[#3D4D59]">
            <section>
              <h2 className="font-serif text-lg font-bold text-[#1F3347]">
                What it is
              </h2>
              <p className="mt-2 leading-relaxed">
                You pick how you feel once a day and add a short note if you
                want. Over time, you see your own pattern, with a simple insight
                about how your week is going.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-lg font-bold text-[#1F3347]">
                What it is not
              </h2>
              <p className="mt-2 leading-relaxed">
                MindMeter is for reflection and for pointing you to real help.
                It is not medical advice and it does not diagnose. Insights come
                from simple rules based on your check-ins, not a clinical test.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-lg font-bold text-[#1F3347]">
                Your privacy
              </h2>

              <div className="mt-2 space-y-3 leading-relaxed">
                <p>
                  There is no account, name, email, or student number. Check-ins
                  are linked to a random code stored only in this browser, so
                  clearing browser data also removes access to your history.
                </p>

                <p>
                  Optional notes may be analysed only to identify broad themes
                  such as sleep or exams. Notes that indicate a crisis are never
                  sent for analysis and take you straight to support.
                </p>
              </div>
            </section>

            <section>
              <h2 className="font-serif text-lg font-bold text-[#1F3347]">
                If you need help
              </h2>
              <p className="mt-2 leading-relaxed">
                Real people at UGM are here to listen, any time.
              </p>

              <Link
                href="/support"
                className="mt-3 inline-flex rounded-lg bg-[#F6A15E] px-5 py-2.5 text-sm font-bold text-[#1F3347] transition-colors hover:bg-[#E09152]"
              >
                See support contacts
              </Link>
            </section>
          </div>

          <footer className="mt-8 border-t border-[#C8CED0] pt-2">
            <p className="text-[10px] text-[#5E6A70]">
              MindMeter is a senior project at DTETI, Universitas Gadjah Mada,
              2026.
            </p>

            <Link
              href="/support"
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[#C9AFD8] px-5 py-3 text-sm font-bold text-[#1F3347] transition-colors hover:bg-[#B99BCB]"
            >
              Need to talk to someone?
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </footer>
        </div>
      </section>
    </>
  );
};
