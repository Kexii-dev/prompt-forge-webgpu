import Link from 'next/link';

const Nav = () => {
  return (
    <nav className="bg-gray-950 p-4">
      <ul className="flex space-x-4">
        <li>
          <Link href="/" className="text-indigo-500 hover:text-indigo-400">
            Prompt Forge
          </Link>
        </li>
        <li>
          <Link href="/compare" className="text-indigo-500 hover:text-indigo-400">
            Comparer
          </Link>
        </li>
        <li>
          <Link href="/settings" className="text-indigo-500 hover:text-indigo-400">
            Réglages
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Nav;
