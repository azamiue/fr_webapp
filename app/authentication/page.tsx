"use client";

import { title } from "@/components/primitives";
import { useForm, FormProvider, useWatch } from "react-hook-form";
import { AuthenticatorSchema } from "./type";
import { zodResolver } from "@hookform/resolvers/zod";
import { authenSchema } from "./type";
import { InputValid } from "./input";
import React, { useEffect } from 'react';
import { Bounce, ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function AuthenPage() {
  const methods = useForm<AuthenticatorSchema>({
    resolver: zodResolver(authenSchema),
    defaultValues: {
      email: "",
      loading: false,
      success: false,
      fail: false,
    },
  });

  const { control, setValue } = methods;
  const success = useWatch({ control, name: "success" });
  const fail = useWatch({ control, name: "fail" });

  useEffect(() => {
    if (success) {
      toast.success('Email is valid!', {
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        transition: Bounce
      });
    }

    if (fail) {
      toast.error('Email is invalid!', {
        position: "top-center",
        autoClose: 1000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        transition: Bounce
      });
      setValue("fail", false);
    }
  }, [success, fail]);

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-xl text-center justify-center">
        <span className={title({ color: "violet" })}>Authentication&nbsp;</span>
      </div>

      <FormProvider {...methods}>
        <InputValid />
        <ToastContainer/>
      </FormProvider>
    </section>
  );
}
