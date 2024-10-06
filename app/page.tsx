"use client";

import { title } from "@/components/primitives";
import { useForm, FormProvider, useWatch } from "react-hook-form";
import { AuthenticatorSchema } from "./type";
import { zodResolver } from "@hookform/resolvers/zod";
import { authenSchema } from "./type";
import { InputValid } from "./input";
import React, { useEffect, useMemo } from "react";
import { Bounce, ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { InformationPage } from "./information";
import { getOSInfo, getBrowserInfo } from "./infoBrowser";

export default function AuthenPage() {
  const methods = useForm<AuthenticatorSchema>({
    resolver: zodResolver(authenSchema),
    defaultValues: {
      email: "",
      loading: false,
      success: false,
      fail: false,
      os: getOSInfo(),
      browser: getBrowserInfo(),
      pubIP: "",
    },
  });

  const { control, setValue } = methods;
  const success = useWatch({ control, name: "success" });
  const fail = useWatch({ control, name: "fail" });

  useEffect(() => {
    if (success) {
      toast.success("Email is valid!", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        transition: Bounce,
      });
    }

    if (fail) {
      toast.error("Email is invalid!", {
        position: "top-right",
        autoClose: 1000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        transition: Bounce,
      });
      setValue("fail", false);
    }
  }, [success, fail]);

  useEffect(() => {
    async function fetchData() {
      fetch("https://api.ipify.org?format=json")
        .then((response) => response.json())
        .then((data) => {
          setValue("pubIP", data.ip);
        })
        .catch((error) => {
          console.error("Error fetching IP address:", error);
        });
    }
    fetchData();
  }, []);

  return (
    <section>
      {!success && (
        <div className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
          <div className="inline-block max-w-xl text-center justify-center">
            <span className={title({ color: "pink" })}>
              Authentication&nbsp;
            </span>
          </div>
          <h1 className="text-sm font-semibold">
            Eligibility check: enter your email you have received an invitation
            from the organizers
          </h1>
          <FormProvider {...methods}>
            <InputValid />
          </FormProvider>
        </div>
      )}
      {success && (
        <FormProvider {...methods}>
          <InformationPage />
        </FormProvider>
      )}
      <ToastContainer />
    </section>
  );
}
