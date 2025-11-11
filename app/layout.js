import { Poppins, Open_Sans } from 'next/font/google'
import './globals.css'
import { OnboardingProvider } from '@/lib/context/OnboardingContext'

const poppins = Poppins({ 
  subsets: ['latin'],
  variable: '--font-poppins',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  preload: true,
})

const openSans = Open_Sans({ 
  subsets: ['latin'],
  variable: '--font-open-sans',
  weight: ['400', '500', '600'],
  display: 'swap',
  preload: true,
})

export const metadata = {
  title: 'Daybreak Health - Parent Onboarding',
  description: 'Onboarding flow for Daybreak Health parents',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} ${openSans.variable} font-sans`}>
        <OnboardingProvider>
          {children}
        </OnboardingProvider>
      </body>
    </html>
  )
}

