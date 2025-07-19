"use client"

import { useState } from "react"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import Image from "next/image"
// import Logo from "../../public/logo.svg"
// import Link from "next/link"

export default function UserMenu({ user }: { user: User }) {
  const [showMenu, setShowMenu] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setShowLogoutModal(false)
    router.push("/login")
  }

  return (
    <div className="relative">
      {/* Header */}
      <div className="bg-white w-full shadow">
        <div className="w-full flex flex-col items-center justify-center mx-auto">
          <div className="flex justify-between w-full items-center px-4 pt-4 pb-4">
            {/* <div className="flex items-end gap-2">
              <Link href="/dashboard" className="font-bold text-xl">
                <Image src={Logo} className="w-24" alt="Tailor CV logo" />
              </Link>
              <p className="px-2 py-1 text-green-600 font-medium bg-green-100 w-fit text-[12px] border border-green-300 rounded-full">
                Free plan
              </p>
            </div> */}

            {/* Profile */}
            <button title="clickable profile image button" onClick={() => setShowMenu(!showMenu)}>
              <Image
                src={user?.user_metadata?.avatar_url || "/placeholder.jpg"}
                alt="user profile image"
                width={40}
                height={40}
                className="rounded-full object-cover"
              />
            </button>
          </div>
        </div>
      </div>

      {/* Dropdown Menu */}
      {showMenu && (
        <div className="absolute right-4 top-[80px] z-50 bg-white shadow-lg rounded-lg border w-48">
          <button
            onClick={() => {
              setShowHistory(true)
              setShowMenu(false)
            }}
            className="w-full px-4 py-2 text-left hover:bg-gray-100"
          >
            View History
          </button>
          <button
            onClick={() => {
              setShowLogoutModal(true)
              setShowMenu(false)
            }}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 text-red-600"
          >
            Logout
          </button>
        </div>
      )}

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-[90%] max-w-sm">
            <h2 className="text-lg font-semibold mb-4">Confirm Logout</h2>
            <p className="mb-6 text-sm text-gray-600">Are you sure you want to logout?</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Sidebar */}
      {showHistory && (
        <div className="fixed top-0 right-0 w-80 h-full bg-white shadow-lg z-50">
          <div className="flex justify-between items-center px-4 py-3 border-b">
            <h3 className="font-semibold text-lg">History</h3>
            <button onClick={() => setShowHistory(false)}>✕</button>
          </div>
          <div className="p-4">
            {/* History content here */}
            <p className="text-sm text-gray-500">Your recent resume generations will appear here.</p>
          </div>
        </div>
      )}
    </div>
  )
}
