import Image from 'next/image'
import Link from 'next/link'
import Logo from "../../public/logo.svg"

const NavLanding = () => {
    return (
        <nav className="w-full flex items-center sticky top-0 z-10 justify-between pt-2 px-2 bg-white shadow " >
            <Image src={Logo} className="w-24" priority alt="Tailor CV logo" />
            <div className="flex items-center space-x-4" >
                <Link href="/pricing" className=" text-gray-700 p-4 flex items-center justify-center font-medium ">Pricing</Link>
                <Link href="/login" className="py-2 px-4 flex items-center justify-center rounded-md border border-blue-600 text-blue-600 font-semibold ">
                    Login
                </Link>
            </div>
        </nav>
    )
}

export default NavLanding