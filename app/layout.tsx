import type { Metadata, Viewport } from "next"
import { Atkinson_Hyperlegible, Geist_Mono, Lexend } from "next/font/google"
import { Suspense } from "react"
import { AnnounceProvider } from "@/components/announce"
import { HelpmeshPrivyProvider } from "@/components/providers/privy-provider"
import { Shell } from "@/components/shell"
import "./globals.css"

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
})

const atkinson = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-atkinson",
  display: "swap",
})

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
  display: "swap",
})

const themeBoot = `(function(){try{var r=document.documentElement;var m=document.cookie.match(/(?:^|; )hm=([^;]*)/);var p=m?JSON.parse(decodeURIComponent(m[1])):{};var prefersDark=window.matchMedia("(prefers-color-scheme:dark)").matches;var theme=p.theme||"system";if(theme==="system"){r.classList.add(prefersDark?"dark":"light");}else if(theme==="light"){r.classList.add("light");r.dataset.theme="light";}else{r.classList.add("dark");if(theme!=="dark")r.dataset.theme=theme;}if(p.textSize&&p.textSize!=="normal")r.dataset.text=p.textSize;if(p.font==="dyslexia")r.dataset.font="dyslexia";if(p.font==="atkinson")r.dataset.font="atkinson";if(p.reduceMotion===true)r.dataset.motion="reduce";if(p.reduceMotion===false)r.dataset.motion="ok";if(p.focusStyle&&p.focusStyle!=="default")r.dataset.focus=p.focusStyle;if(p.touchTarget&&p.touchTarget!=="default")r.dataset.touch=p.touchTarget;if(p.highContrastFocus)r.dataset.highfocus="true";if(p.largeCursor)r.dataset.cursor="large";if(p.screenReaderOptimized)r.dataset.screenreader="true";if(p.switchAccess)r.dataset.switchaccess="true";}catch(e){}})();`

export const metadata: Metadata = {
  title: { default: "HelpMesh", template: "%s · HelpMesh" },
  description: "Ask someone nearby for help, offer help, or fund it.",
  applicationName: "HelpMesh",
  robots: { index: true, follow: true },
  openGraph: {
    title: "HelpMesh",
    description: "Ask someone nearby for help, offer help, or fund it.",
    siteName: "HelpMesh",
    locale: "en_US",
    type: "website",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#171311" },
    { media: "(prefers-color-scheme: light)", color: "#eef3f0" },
  ],
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistMono.variable} ${atkinson.variable} ${lexend.variable} font-mono`}>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
        <AnnounceProvider>
          <HelpmeshPrivyProvider>
            <Suspense fallback={null}>
              <Shell>{children}</Shell>
            </Suspense>
          </HelpmeshPrivyProvider>
        </AnnounceProvider>
      </body>
    </html>
  )
}
