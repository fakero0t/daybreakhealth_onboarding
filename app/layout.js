import { Poppins, Vollkorn } from 'next/font/google'
import './globals.css'
import { OnboardingProvider } from '@/lib/context/OnboardingContext'

const poppins = Poppins({ 
  subsets: ['latin'],
  variable: '--font-poppins',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  preload: true,
})

const vollkorn = Vollkorn({ 
  subsets: ['latin'],
  variable: '--font-vollkorn',
  weight: ['400', '500', '600', '700'],
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
      <body className={`${poppins.variable} ${vollkorn.variable} font-sans`}>
        <OnboardingProvider>
          {children}
        </OnboardingProvider>
      </body>
    </html>
  )
}

