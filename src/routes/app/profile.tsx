import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '~/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import {
  User,
  Mail,
  MapPin,
  Briefcase,
  Calendar,
  TrendingUp,
  Heart,
  Camera,
  LogOut,
  Save,
  Shield,
  BarChart3,
  Receipt,
} from 'lucide-react'

export const Route = createFileRoute('/app/profile')({
  component: ProfilePage,
})

interface UserProfile {
  name: string
  age: number
  gender: string
  marital_status: string
  job: string
  location: string
  investment_level: string
  financial_type: string
  avatar_url?: string
}

interface UserStats {
  totalBudgets: number
  totalTransactions: number
  memberSince: string
  lastActivity: string
}

function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    age: 0,
    gender: '',
    marital_status: '',
    job: '',
    location: '',
    investment_level: '',
    financial_type: '',
  })
  const [stats, setStats] = useState<UserStats>({
    totalBudgets: 0,
    totalTransactions: 0,
    memberSince: '',
    lastActivity: '',
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>('')

  useEffect(() => {
    loadUserData()
  }, [])

  async function loadUserData() {
    try {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.navigate({ to: '/login' })
        return
      }

      setUserEmail(user.email || '')

      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profile')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (profileError) {
        console.error('Error loading profile:', profileError)
      } else if (profileData) {
        setProfile({
          name: profileData.name || '',
          age: profileData.age || 0,
          gender: profileData.gender || '',
          marital_status: profileData.marital_status || '',
          job: profileData.job || '',
          location: profileData.location || '',
          investment_level: profileData.investment_level || '',
          financial_type: profileData.financial_type || '',
        })
      }

      // Load statistics
      const { data: budgetData } = await supabase
        .from('budget_history')
        .select('created_at')
        .eq('user_id', user.id)

      const { data: transactionData } = await supabase
        .from('transactions')
        .select('created_at')
        .eq('user_id', user.id)

      setStats({
        totalBudgets: budgetData?.length || 0,
        totalTransactions: transactionData?.length || 0,
        memberSince: user.created_at,
        lastActivity: budgetData?.[0]?.created_at || user.created_at,
      })
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveProfile() {
    try {
      setSaving(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Upload avatar if new file selected
      if (avatarFile) {
        // For now, we'll skip avatar upload since the column doesn't exist yet
        // This can be added later after adding avatar_url column to database
        console.log('Avatar upload will be implemented after database update')
      }

      // Update profile (without avatar_url for now)
      // Update profile (without avatar_url for now)
      const { error: updateError } = await supabase
        .from('user_profile')
        .update({
          name: profile.name,
          age: profile.age,
          gender: profile.gender,
          marital_status: profile.marital_status,
          job: profile.job,
          location: profile.location,
          investment_level: profile.investment_level,
          financial_type: profile.financial_type,
        })
        .eq('user_id', user.id)

      if (updateError) throw updateError

      alert('✅ Profile updated successfully!')
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('❌ Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.navigate({ to: '/login' })
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid gap-6">
              <div className="h-96 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
          <p className="text-gray-600">Manage your account and personal information</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Avatar & Stats */}
          <div className="space-y-6">
            {/* Avatar Card */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Picture</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-4xl font-bold overflow-hidden">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      profile.name.charAt(0).toUpperCase() || 'U'
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-full cursor-pointer shadow-lg transition-colors">
                    <Camera size={16} />
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleAvatarChange}
                    />
                  </label>
                </div>
                <h3 className="mt-4 text-xl font-semibold text-gray-900">{profile.name}</h3>
                <p className="text-gray-500 flex items-center gap-1 mt-1">
                  <Mail size={14} />
                  {userEmail}
                </p>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600">
                    <BarChart3 size={18} />
                    <span>Total Budgets</span>
                  </div>
                  <Badge variant="default">{stats.totalBudgets}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Receipt size={18} />
                    <span>Total Transactions</span>
                  </div>
                  <Badge variant="default">{stats.totalTransactions}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar size={18} />
                    <span>Member Since</span>
                  </div>
                  <span className="text-sm text-gray-700">
                    {new Date(stats.memberSince).toLocaleDateString('id-ID', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Profile Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="name"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        className="pl-10"
                        placeholder="Your name"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="age">Age</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="age"
                        type="number"
                        value={profile.age}
                        onChange={(e) =>
                          setProfile({ ...profile, age: parseInt(e.target.value) || 0 })
                        }
                        className="pl-10"
                        placeholder="Your age"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <select
                      id="gender"
                      value={profile.gender}
                      onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="marital_status">Marital Status</Label>
                    <div className="relative">
                      <Heart className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <select
                        id="marital_status"
                        value={profile.marital_status}
                        onChange={(e) =>
                          setProfile({ ...profile, marital_status: e.target.value })
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                      >
                        <option value="">Select status</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Divorced">Divorced</option>
                        <option value="Widowed">Widowed</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="job">Occupation</Label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="job"
                        value={profile.job}
                        onChange={(e) => setProfile({ ...profile, job: e.target.value })}
                        className="pl-10"
                        placeholder="Your job"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="location">Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="location"
                        value={profile.location}
                        onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                        className="pl-10"
                        placeholder="Your location"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Profile */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Profile</CardTitle>
                <CardDescription>
                  This helps AI provide better budget recommendations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="investment_level">Investment Experience</Label>
                    <div className="relative">
                      <TrendingUp className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <select
                        id="investment_level"
                        value={profile.investment_level}
                        onChange={(e) =>
                          setProfile({ ...profile, investment_level: e.target.value })
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                      >
                        <option value="">Select level</option>
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                        <option value="Expert">Expert</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="financial_type">Financial Type</Label>
                    <select
                      id="financial_type"
                      value={profile.financial_type}
                      onChange={(e) =>
                        setProfile({ ...profile, financial_type: e.target.value })
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                    >
                      <option value="">Select type</option>
                      <option value="Conservative">Conservative (Risk-averse)</option>
                      <option value="Moderate">Moderate (Balanced)</option>
                      <option value="Aggressive">Aggressive (Risk-taker)</option>
                    </select>
                  </div>
                </div>

                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                  <p className="text-sm text-emerald-800">
                    💡 <strong>Tip:</strong> Your financial profile helps our AI generate
                    personalized budget recommendations based on your risk tolerance and investment
                    experience.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Account Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your account security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">Email</p>
                      <p className="text-sm text-gray-500">{userEmail}</p>
                    </div>
                  </div>
                  <Badge variant="outline">Verified</Badge>
                </div>

                <Button variant="destructive" onClick={handleLogout} className="w-full">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={loadUserData}>
                Cancel
              </Button>
              <Button onClick={handleSaveProfile} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
