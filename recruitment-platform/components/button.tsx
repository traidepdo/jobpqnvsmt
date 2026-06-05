interface Props {
    text: string;
    type: "button" | "submit" | "reset";
    onClick: () => void;
}

const Button = ({ text, onClick, type }: Props) => {
    return (
        <button onClick={onClick} type={type} className="btn btn-primary">
            {text}
        </button>
    );
}

export default Button;
