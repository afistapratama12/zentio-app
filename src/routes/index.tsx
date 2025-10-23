import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import {
  Sparkles,
  TrendingUp,
  Shield,
  Zap,
  Camera,
  Brain,
  Trophy,
  ArrowRight,
} from 'lucide-react'

export const Route = createFileRoute('/')({ component: HomePage })

function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-transparent" />
        <div className="container mx-auto px-4 py-20 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              AI-Powered Budgeting Assistant
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Zentio: Budgeting Pintar dengan AI
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Upload foto struk belanja, biarkan AI kami menganalisis pengeluaran, dan dapatkan budget personal yang disesuaikan dengan gaya hidup Anda.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  Mulai Gratis
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline">
                Lihat Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Fitur Unggulan
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Zentio menggunakan teknologi AI terkini untuk membantu Anda mengelola keuangan dengan lebih mudah dan efektif
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Card className="border-emerald-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                  <Camera className="w-6 h-6 text-emerald-600" />
                </div>
                <CardTitle>Scan Struk Otomatis</CardTitle>
                <CardDescription>
                  Upload foto struk belanja, AI akan otomatis mengenali dan mencatat semua transaksi Anda
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-teal-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-teal-600" />
                </div>
                <CardTitle>AI Conversational Onboarding</CardTitle>
                <CardDescription>
                  Chat dengan AI untuk setup profil keuangan. Mudah, cepat, dan personal!
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-emerald-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
                <CardTitle>Budget Personal AI</CardTitle>
                <CardDescription>
                  AI menganalisis pengeluaran Anda dan membuat budget yang sesuai dengan gaya hidup dan tujuan finansial
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-teal-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-teal-600" />
                </div>
                <CardTitle>Data Aman & Private</CardTitle>
                <CardDescription>
                  Data keuangan Anda tersimpan aman dengan enkripsi end-to-end di Supabase
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-emerald-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-emerald-600" />
                </div>
                <CardTitle>Real-time Insights</CardTitle>
                <CardDescription>
                  Visualisasi pengeluaran real-time dengan chart interaktif dan insights mendalam
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-teal-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                  <Trophy className="w-6 h-6 text-teal-600" />
                </div>
                <CardTitle>Gamifikasi & Rewards</CardTitle>
                <CardDescription>
                  Dapatkan points dan badges saat Anda mencapai target budgeting. Belajar keuangan jadi fun!
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Cara Kerja
            </h2>
            <p className="text-gray-600">
              Mulai budgeting cerdas hanya dalam 3 langkah sederhana
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4 mx-auto">
                1
              </div>
              <h3 className="text-xl font-semibold mb-3">Setup Profil</h3>
              <p className="text-gray-600">
                Chat dengan AI untuk setup profil keuangan Anda. AI akan menanyakan pertanyaan sederhana tentang gaya hidup dan tujuan finansial
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4 mx-auto">
                2
              </div>
              <h3 className="text-xl font-semibold mb-3">Upload Transaksi</h3>
              <p className="text-gray-600">
                Foto struk belanja Anda, upload ke Zentio. AI Vision akan otomatis membaca dan mencatat semua transaksi
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4 mx-auto">
                3
              </div>
              <h3 className="text-xl font-semibold mb-3">Dapatkan Budget AI</h3>
              <p className="text-gray-600">
                AI menganalisis pola pengeluaran Anda dan membuat budget personal yang realistis dan achievable
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 border-0 text-white">
            <CardContent className="p-12 text-center">
              <Sparkles className="w-12 h-12 mx-auto mb-4" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Siap Mulai Budgeting Pintar?
              </h2>
              <p className="text-emerald-50 text-lg mb-8 max-w-2xl mx-auto">
                Bergabung dengan ribuan pengguna yang sudah mencapai tujuan finansial mereka dengan bantuan AI
              </p>
              <Link to="/login">
                <Button
                  size="lg"
                  className="bg-white text-emerald-600 hover:bg-emerald-50"
                >
                  Daftar Sekarang - Gratis!
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Zentio</h3>
              <p className="text-sm">
                AI-powered budgeting assistant untuk membantu Anda mencapai tujuan finansial
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-emerald-400 transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-emerald-400 transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-emerald-400 transition-colors">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-emerald-400 transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-emerald-400 transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-emerald-400 transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-emerald-400 transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-emerald-400 transition-colors">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-emerald-400 transition-colors">
                    Security
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-sm text-center">
            <p>© 2024 Zentio. All rights reserved. Built with ❤️ using AI.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
