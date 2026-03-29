import './globals.css'

export const metadata = {
  title: 'Spending Tracker',
  description: 'Track your expenses',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
    }
