import {
  Activity,
  BookOpen,
  DraftingCompass,
  Mail,
  MessageSquare,
  Rocket,
  Zap,
} from "lucide-react";
import VideoPlayer from "../ui/video-player";

export function Features() {
  return (
    <section className="py-16 md:py-32" id="features">
      <div className="mx-auto max-w-xl md:max-w-6xl px-6">
        <div className="grid items-center gap-12 md:grid-cols-2 md:gap-12 lg:grid-cols-5 lg:gap-24">
          <div className="lg:col-span-2">
            <div className="md:pr-6 lg:pr-0">
              <h2 className="text-4xl font-semibold lg:text-5xl">
                Built for Scaling teams
              </h2>
              <p className="mt-6">
                Designed to empower support teams of any size with seamless
                collaboration, instant context, and automation that scales as
                you do without slowing you down.
              </p>
            </div>
            <ul className="mt-8 divide-y border-y *:flex *:items-center *:gap-3 *:py-3">
              <li>
                {/* <MessageSquare className="size-5" /> */}
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.056 19.902 19.902 0 0 0 5.993 3.03.077.077 0 0 0 .084-.028c.462-.63.874-1.296 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.125-.094.25-.19.369-.287a.075.075 0 0 1 .077-.01c3.927 1.793 8.18 1.793 12.061 0a.075.075 0 0 1 .078.01c.12.097.244.193.369.287a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.363 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                Discord Support
              </li>
              <li>
                <Zap className="size-5" />
                Fast response time
              </li>
              <li>
                <Rocket className="size-5" />
                Instant setup
              </li>
              <li>
                <BookOpen className="size-5" />
                Accurate answers from your knowledge base
              </li>
            </ul>
          </div>
          <div className=" relative rounded-3xl border  lg:col-span-3">
            {/* <div className="bg-gradient-to-b aspect-76/59 relative rounded-2xl from-zinc-300 to-transparent p-px dark:from-zinc-700"> */}
            <img
              src="https://tailark.com/_next/image?url=%2Fpayments.png&w=3840&q=75"
              className="hidden  dark:block"
              alt="payments illustration dark"
              width={1207}
              height={929}
            />
            <VideoPlayer src="https://dwfi8ba1rjjy19kb.public.blob.vercel-storage.com/Demo-2.mov" />
            {/* </div> */}
          </div>
        </div>
      </div>
    </section>
  );
}
