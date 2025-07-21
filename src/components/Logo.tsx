import Image from "next/image"
import Link from "next/link"

export default function LogoMain() {
    return (
        <Link href="/dashboard" className="absolute top-[38px] left-1/2 transform -translate-x-1/2 -translate-y-1/2absolute flex self-center justify-self-center z-50 top-10 mx-auto text-xl">
            <Image src={"/logo2.svg"} width={100} height={30} className="w-24" alt="Tailor CV logo" />
        </Link>
    )
}