import {FC} from "react";

interface ButtonProps {
    isLogin: boolean;
    type: string;
    disabled: boolean;
}

const Button: FC<ButtonProps> = ({isLogin, type, disabled}) => {
    return (
        <button className="w-full px-6 py-4 rounded-xl border bg-gradient-to-r from-purple-400 to-cyan-700 cursor-pointer hover:border hover:border-pink-200 transition-all">
            {isLogin ? "Login" : "Create an Account"}
        </button>
    )
}

export default Button;