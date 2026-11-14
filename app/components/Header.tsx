import { Link } from "react-router";

export default function Header() {
    return (
        <header className="bg-gray-100 dark:bg-gray-900 p-4 h-1/12 flex items-center">
            <Link to="/" className="text-blue-500">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                    Crypto Trading Simulator
                </h1>
            </Link>
            <Link to="/" className="ml-4 text-blue-500">
                Discover
            </Link>
            <Link to="/portfolio" className="ml-4 text-blue-500">
                Portfolio
            </Link>
            <div className="ml-auto">
                balance
            </div>
            <div className="ml-4">
                profile
            </div>
        </header>
    );
}