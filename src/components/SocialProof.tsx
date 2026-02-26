import Image from "next/image";
import StudentCounter from "./StudentCounter";

export default function SocialProof() {
  const avatars = [
    "/user-kevin.png",
    "/user-mohammad.png",
    "/user-filipe.jpg",
    "/user-james.jpg",
  ];

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
      {/* Avatars */}
      <div className="flex -space-x-3">
        {avatars.map((src, i) => (
          <div
            key={i}
            className="relative h-12 w-12 overflow-hidden rounded-full border-3 border-foreground bg-surface shadow-[2px_2px_0_0_#1a1a1a]"
          >
            <Image
              src={src}
              alt={`Student ${i + 1}`}
              fill
              className="object-cover"
            />
          </div>
        ))}
      </div>
      
      {/* Stars & Copy */}
      <div className="flex flex-col items-center sm:items-start">
        <div className="flex gap-1 text-[#FFB800]">
          {/* 5 Stars */}
          {[...Array(5)].map((_, i) => (
            <svg
              key={i}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5 drop-shadow-[1px_1px_0_rgba(26,26,26,1)]"
            >
              <path
                fillRule="evenodd"
                d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                clipRule="evenodd"
              />
            </svg>
          ))}
        </div>
        <p className="mt-1 text-sm font-bold text-foreground">
          <StudentCounter />+ students building faster
        </p>
      </div>
    </div>
  );
}
