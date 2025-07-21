interface PageHeadingProps {
    title: string
}

export const PageHeading: React.FC<PageHeadingProps> = ({title}) => {
    return (
        <div className="px-4 flex items-center justify-center w-full" >
            <h1 className="text-4xl text-center font-bold text-gray-600">{title}</h1>
        </div>
    )
}