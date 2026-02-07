import Link from 'next/link'
import { Button } from '@/components/Button/Button'
import { Icon } from '@/components/Icon/Icon'
import { appName } from '@/lib/constants'

export function Navbar() {
  return (
    <nav className="bg-gray-400 flex items-center justify-between w-full mx-auto">
        <div className="flex gap-auto size-full text-center">
            <Link href="..\" className="hover:bg-slate-300 flex w-20 justify-center items-center flex-shrink-0">
                <span className="flex justify-center items-center">
                    <p className="font-semibold text-3xl">←</p>
                </span>
            </Link>
            <Link href=".\notes" className="hover:bg-slate-300 border-l-4 px-4 border-solid border-black flex flex-1 justify-center items-center">
                <span className="flex justify-center items-center">
                    <Icon name="edit" size={28} />
                    <p className="font-semibold text-xl">Notes</p>
                </span>
            </Link>
            <Link href=".\report" className="hover:bg-slate-300 py-4 border-x-4 px-4 border-solid border-black flex flex-1 justify-center items-center">
                <span className="flex justify-center items-center">
                    <Icon name="eye" size={28} />
                    <p className="font-semibold text-xl">Report</p>
                </span>
            </Link>
            <Link href=".\course_docs" className="hover:bg-slate-300 flex flex-1 justify-center items-center">
                <span className="flex justify-center items-center">
                    <Icon name="book" size={28} />
                    <p className="font-semibold text-xl">Course Material</p>
                </span>
            </Link>
        </div>
    </nav>
  )
}