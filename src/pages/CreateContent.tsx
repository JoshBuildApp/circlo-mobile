import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * CreateContent page — redirects to home and opens the new content creator.
 * The actual creator lives in NewContentCreator and is mounted in AppShell.
 */
const CreateContent = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Navigate home and open the creator
    navigate("/", { replace: true });
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("open-create-sheet"));
    }, 100);
  }, [navigate]);

  return null;
};

export default CreateContent;
