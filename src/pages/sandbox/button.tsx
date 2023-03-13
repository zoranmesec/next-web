import Button from "../../components/ui/button";

function ButtonPage() {
  return (
    <div className="m-8">
      <h3>Button demo</h3>

      <div className="mt-14 w-80">
        <h5>Default (primary) button</h5>
        <Button variant="primary" className="mt-4">
          Button
        </Button>
      </div>

      <div className="mt-14 w-80">
        <h5>Secondary button</h5>
        <Button variant="secondary" className="mt-4">
          Button
        </Button>
      </div>

      <div className="mt-14 w-80">
        <h5>A disabled primary button</h5>
        <Button variant="primary" className="mt-4" isDisabled>
          Button
        </Button>
      </div>

      <div className="mt-14 w-80">
        <h5>A disabled secondary button</h5>
        <Button variant="secondary" className="mt-4" isDisabled>
          Button
        </Button>
      </div>

      {/* <div className="mt-14 w-80">
        <h5>A loading button (TODO)</h5>
        <Button variant="secondary" className="mt-4" loading>
          Button
        </Button>
      </div> */}

      <div className="mt-16">
        <h3 className="text-lg">Notes</h3>
        <div className="pl-4">
          <ul className="mt-2 list-outside list-disc">
            <li>A button with icon should be implemented.</li>
            <li>A loading state should be designed and implemented.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ButtonPage;