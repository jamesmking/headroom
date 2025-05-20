import Link from "next/link";
import { homePath, ticketsPath } from "@/routes";

const Header = () => {
  return (
    <header className="flex justify-between items-center p-4 bg-gray-800 text-white">
      <h1 className="text-2xl">My App</h1>
      <nav>
        <ul className="flex space-x-4">
          <li>
            <Link href={homePath()}>Home</Link>
          </li>
          <li>
            <Link href={ticketsPath()}>Tickets</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export { Header };
