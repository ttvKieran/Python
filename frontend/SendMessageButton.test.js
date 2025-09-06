import { render, screen, fireEvent } from "@testing-library/react";
import SendMessageButton from "./SendMessageButton";

test("renders send button and handles click", () => {
    render(<SendMessageButton />);
    const button = screen.getByText(/Send/i);

    // Kiểm tra xem nút có xuất hiện không
    expect(button).toBeInTheDocument();

    // Kiểm tra hành động khi nhấn nút
    fireEvent.click(button);
    expect(screen.getByText(/Message sent!/i)).toBeInTheDocument();
});
