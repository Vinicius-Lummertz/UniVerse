import { useContext } from 'react';
import AuthContext from '../context/AuthContext';
import SearchUser from './SearchUser';

const Navbar = () => {
    const { logoutUser } = useContext(AuthContext);

    return (
        <div className="navbar bg-base-200 shadow-lg">
            <div className="navbar-start">
                <a className="btn btn-ghost text-xl">UniVerse</a>
            </div>
            
            <div className="navbar-center hidden lg:flex">
                <SearchUser />
            </div>

            <div className="navbar-end">
                <button className="btn btn-error btn-sm" onClick={logoutUser}>
                    Sair
                </button>
            </div>
        </div>
    );
};

export default Navbar;