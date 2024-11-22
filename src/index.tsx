import * as React from "react";
import {
    invokeMaybeCallable,
    type BaseProps,
    type FormProps,
    type GetBasePropType,
    type GetFCArg,
    type GetSectionArgument,
    type FormField,
    type Section,
    type DefaultSectionHeaderProps
} from './types';

export {
    type BaseProps
};

/**
 * Default section header component
 */
function DefaultSectionHeader({ title, children }: DefaultSectionHeaderProps) {
    return <fieldset>
        <legend>{title}</legend>
        {children}
    </fieldset>;
}

export class FormBuilder<C, S> {
    private controls: { [type: string]: React.FC<unknown> };
    private sectionHeader: S;

    private constructor(sectionHeader: S) {
        this.controls = {};
        this.sectionHeader = sectionHeader;
    }

    public static withDefaultSection<C>(): FormBuilder<C, typeof DefaultSectionHeader> {
        return new FormBuilder(DefaultSectionHeader);
    }

    public static withSection<C, S extends DefaultSectionHeaderProps>(component: React.FC<S>): FormBuilder<C, React.FC<S>> {
        return new FormBuilder(component);
    }

    registerControl<
        T extends string,
        F extends React.FC<GetFCArg<F>>,
    >(
        type: T,
        component: F
    ): FormBuilder<C & { [K in T]: F }, S> {
        this.controls[type] = component as React.FC<unknown>;
        return this as FormBuilder<C & { [K in T]: F }, S>;
    }

    createForm<M>(
        sections: Array<Section<M, C> & GetSectionArgument<S>>
    ): React.FC<FormProps<M, C>> {
        const sectionHeader = this.sectionHeader as React.FC<{ title: string, children: React.ReactNode } & unknown>;
        const controls = this.controls as Record<keyof C, React.FC<BaseProps<unknown> & unknown>>;

        return function Form({
            model: initialModel,
            afterPropertyChange,
            onSubmit,
            submitButton,
        }: FormProps<M, C>) {
            const [model, setModel] = React.useState(initialModel);
            const [errors, setErrors] = React.useState(new Map<FormField<M, C>, string>());
            const setters = React.useMemo(() => {
                const result = new Map<
                    FormField<M, C>,
                    <T, >(setModel: React.Dispatch<React.SetStateAction<M>>, value: T) => void
                >();

                for (const section of sections) {
                    for (const field of section.fields) {
                        // TODO: make this work with array indexes as well
                        // currently it only supports `a.b.c` but not `a[0].b.c`
                        const path = field.value.toString().split('=>')[1].trim().split('.');
                        const fieldName = path.pop()!;

                        result.set(field,
                            <T,>(setModel: React.Dispatch<React.SetStateAction<M>>, value: T) => {
                                if (field.validate) {
                                    const error = field.validate(value as GetBasePropType<C, keyof C>);
                                    setErrors(oldErrors => {
                                        const newErrors = new Map(oldErrors);
                                        if (error === null) {
                                            newErrors.delete(field);
                                        } else {
                                            newErrors.set(field, error);
                                        }
                                        return newErrors;
                                    });
                                }

                                setModel(oldModel => {
                                    const newModel = { ...oldModel };
                                    const obj = path.reduce((acc, key) => {
                                        if (!(key in acc)) acc[key] = {};
                                        return acc[key]
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    }, newModel as any);
                                    obj[fieldName] = value;

                                    if(afterPropertyChange) {
                                        afterPropertyChange(newModel, field, value);
                                    }
                                    return newModel;
                                });
                            }
                        );
                    }
                }

                return result;
            }, [])

            const setValue = React.useCallback(<T,>(field: FormField<M, C>, value: T) => {
                const setter = setters.get(field);
                if (setter === undefined) throw "Field not found";
                setter(setModel, value);
            }, [setters, setModel]);

            const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
                if(errors.size !== 0) {
                    e.stopPropagation();
                    e.preventDefault();
                } else if(onSubmit) {
                    onSubmit(model, e);
                }
            }

            const SubmitButton = submitButton ?? (() => <button type="submit">Submit</button>);

            return <form onSubmit={handleSubmit}>
                {sections.map((section, i) => <React.Fragment key={i}>
                    {sectionHeader({
                        ...section,
                        children: section.fields.map((field, j) => {
                            if (invokeMaybeCallable(field.visible) === false) {
                                return null;
                            }

                            const isModified = field.value(initialModel) !== field.value(model);

                            const Control: React.FC<BaseProps<unknown> & unknown> = controls[field.type];
                            const error = errors.get(field);
                            // type magic to make sure we do not forget any props of `BaseProps`
                            // which we have to pass ourselves
                            const extendFields = field as Omit<FormField<M, C>, keyof BaseProps<unknown>>;
                            return <Control
                                {...extendFields}
                                key={j}

                                label={typeof field.label === "function" ? field.label() : field.label}
                                value={field.value(model)}
                                onChange={(v: unknown) => setValue(field, v)}
                                readonly={invokeMaybeCallable(field.readonly) ?? false}
                                isModified={isModified}
                                error={error}
                            />;
                        }),
                    })}
                </React.Fragment>)}
                <SubmitButton />
            </form>;
        };
    }
}
