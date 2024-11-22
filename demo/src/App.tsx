import { useState} from 'react'
import './App.css'
import { FormBuilder, BaseProps } from 'react-formbuilder';

const builder = FormBuilder.withDefaultSection()
  .registerControl("text", TextComponent)
  .registerControl("number", NumberComponent);

type Model = {
  firstName: string;
  age: number;
};

function App() {
  const Form = builder.createForm<Model>([
    {
      title: "Section 1",
      fields: [
        {
          type: "text",
          label: "First Name",
          value: (model: Model) => model.firstName,
          placeholder: "Enter your first name"
        },
        {
          type: "number",
          label: "Age",
          value: (model: Model) => model.age,
          placeholder: "Enter your age"
        }
      ]
    },
  ]);

  const [model, setModel] = useState<Model>({ firstName: "", age: 0 });

  return (
    <>
      <Form 
        model={model}
        onSubmit={(model) => console.log(model)}
        submitButton={() => <button>Submit</button>}
        afterPropertyChange={(model, field, newValue) => console.log(model, field, newValue)}
        />
    </>
  )
}

export default App

interface TextComponentProps extends BaseProps<string> {
  placeholder?: string,
}

function TextComponent(props: TextComponentProps) {
  return <>
    <pre>{JSON.stringify(props)}</pre>
    <input type="text" />
  </>;
}

interface NumberComponentProps extends BaseProps<number> {
  placeholder?: string,
}

function NumberComponent(props: NumberComponentProps) {
  return <>
    <pre>{JSON.stringify(props)}</pre>
    <input type="number" />
  </>;
}