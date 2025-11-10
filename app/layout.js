import { Inter } from 'next/font/google'
import './globals.css'
import { OnboardingProvider } from '@/lib/context/OnboardingContext'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata = {
  title: 'Daybreak Health - Parent Onboarding',
  description: 'Onboarding flow for Daybreak Health parents',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans`}>
        <OnboardingProvider>
          {children}
        </OnboardingProvider>
      </body>
    </html>
  )
}

