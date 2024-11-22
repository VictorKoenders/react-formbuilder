import type { FormEvent } from "react";

/**
 * @description Base props for all form controls
 */
export interface BaseProps<V> {
    /**
     * @description The label for the control
     */
    label: string;
    /**
     * @description The value of the control
     */
    value: V;
    /**
     * @description The function to call when the value of the control changes
     * @param value the new value
     */
    onChange: (value: V) => void;
    /**
     * @description if true, the control is read-only, otherwise it is editable
     */
    readonly: boolean;
    /**
     * @description The error message to display for the control
     */
    error?: string;
    /**
     * @description `true` if the value is different than the initial model
     */
    isModified: boolean;
}

/**
 * @description Get the argument of a section header FC<T>, excluding the title and children
 * @example
 * interface SectionHeaderProps {
 *   title: string;
 *   children: React.ReactNode;
 *   extra: string;
 * }
 * type sectionArg = GetSectionArgument<React.FC<SectionHeaderProps>>;
 * // sectionArg = { extra: string }
 */
export type GetSectionArgument<T> = T extends React.FC<infer P> ? Omit<P, "title" | "children" | "hasValidationError"> : never;
/**
 * @description Get the argument of a React.FC<T> type
 * @example
 * interface Props {
 *  name: string;
 *  age: number;
 * }
 * type arg = GetFCArg<React.FC<Props>>;
 * // arg = { name: string, age: number }
 */
export type GetFCArg<F> = F extends React.FC<infer P> ? P : never;
/**
 * @description Get the object field by the given key
 * @example
 * interface SomeObject {
 *  text: string;
 * }
 * type control = GetObjectFieldByKey<SomeObject, "text">;
 * // control = string
 */
type GetObjectFieldByKey<C, K> = C extends Record<infer O, unknown> ? K extends O ? C[K] : never : never;
/**
 * @description Get the type of the controls BaseProps
 * @example
 * interface FormControls {
 *  text: React.FC<BaseProps<string>>;
 * }
 * type basePropType = GetBasePropType<FormControls, "text">;
 * // basePropType = string
 */
export type GetBasePropType<C, K> = GetFCArg<GetObjectFieldByKey<C, K>> extends BaseProps<infer V> ? V : never;
/**
 * @description Omit the base props from a control
 * @example
 * interface TextProps extends BaseProps<string> {
 *   placeholder: string;
 * }
 * type noBaseProps = OmitBaseProps<TextProps>;
 * // noBaseProps = { placeholder: string }
 */
type OmitBaseProps<A> = A extends BaseProps<infer V> ? Omit<A, keyof BaseProps<V>> : never;
/**
 * @description Get the extended props of a control
 * @example
 * interface TextProps extends BaseProps<string> {
 *    placeholder: string;
 * }
 * type extendedProps = GetExtendedProps<FormControls<{ text: React.FC<TextProps> }, "text">
 * // extendedProps = { placeholder: string }
 */
type GetExtendedProps<C, K> = OmitBaseProps<GetFCArg<GetObjectFieldByKey<C, K>>>;

/**
 * @description Indicates a variable that can either be a value or a function
 * @example
 * const value: MaybeCallable<string> = "hello";
 * const value2: MaybeCallable<string> = () => "hello";
 */
type MaybeCallable<T> = T | (() => T);

/**
 * Invokes a maybe callable value
 * @template T the type of the value, must be a string or boolean
 * @param {MaybeCallable<T>?} value the value to invoke, either a string, boolean, function, or undefined
 * @returns {T | undefined} the value of the callable if it is a function, otherwise the value itself, or undefined if the value is undefined
 */
export function invokeMaybeCallable<T extends string | boolean>(value?: MaybeCallable<T>): T | undefined {
    if (value === undefined) {
        return undefined;
    } else if (typeof value === "function") {
        return value();
    } else {
        return value;
    }
}

/**
 * @description The props for the form component
 * @template M the model type
 * @template C the control type, in the form of `{ [key: string]: React.FC<T extends BaseProps<...>> }`
 */
export type FormProps<M, C> = {
    model: M;
    afterPropertyChange?: (model: M, field: FormField<M, C>, newValue: unknown) => void;
    onSubmit?: (model: M, event: FormEvent<HTMLFormElement>) => void;
    submitButton?: React.FC;
}

export interface Section<M, C> {
    title: string;
    fields: Array<FormField<M, C>>;
};

export type FormField<M, C> = {
    [K in keyof C]: {
        type: K;
        label: MaybeCallable<string>;
        value: (model: M) => GetBasePropType<C, K>;
        validate?: (value: GetBasePropType<C, K>) => string | null;
        readonly?: MaybeCallable<boolean>;
        visible?: MaybeCallable<boolean>;
    } & GetExtendedProps<C, K>;
}[keyof C];


export interface DefaultSectionHeaderProps {
    title: string;
    children: React.ReactNode;
    hasValidationError: boolean;
}
