import type { Metadata, Viewport } from "next"
import { Atkinson_Hyperlegible, Geist_Mono, Lexend } from "next/font/google"
import { Suspense } from "react"
import { AnnounceProvider } from "@/components/announce"
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

const themeBoot = `(function(){try{var m=document.cookie.match(/(?:^|; )hm=([^;]*)/);if(!m)return;var p=JSON.parse(decodeURIComponent(m[1]));var r=document.documentElement;if(p.theme&&p.theme!=="system")r.dataset.theme=p.theme;if(p.textSize&&p.textSize!=="normal")r.dataset.text=p.textSize;if(p.font==="dyslexia")r.dataset.font="dyslexia";if(p.font==="atkinson")r.dataset.font="atkinson";if(p.reduceMotion===true)r.dataset.motion="reduce";if(p.reduceMotion===false)r.dataset.motion="ok";}catch(e){}})();`

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
    <html lang="en" className={`${geistMono.variable} ${atkinson.variable} ${lexend.variable} font-mono dark`}>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
        <AnnounceProvider>
          <Suspense fallback={null}>
            <Shell>{children}</Shell>
          </Suspense>
        </AnnounceProvider>
      </body>
    </html>
  )
}
