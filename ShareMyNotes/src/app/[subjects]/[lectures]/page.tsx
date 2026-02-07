import { redirect } from 'next/navigation'

type Props = {
  params: {
    subjects: string
    lectures: string
  }
}

export default function LecturePage({ params }: Props) {
  const { subjects, lectures } = params
  // Redirect to the notes editor for this lecture
  redirect(`/${encodeURIComponent(subjects)}/${encodeURIComponent(lectures)}/notes`)
}
