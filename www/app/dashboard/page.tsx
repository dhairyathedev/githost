"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const formSchema = z.object({
  gitrepo: z.string().min(1, {
    message: "URL can't be empty.",
  }),
});

function dashboard() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gitrepo: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
  }

  const logs = [
    {
      time: "08:16:45",
      text: "Finding your repo in GitHub"
    },
    {
      time: "08:16:50",
      text: "Mongoose Connection Successfull..."
    },
    {
      time: "08:16:55",
      text: "Backend Deployed"
    },
    {
      time: "08:17:00",
      text: "Checking all Environments Variables"
    },
    {
      time: "08:17:10",
      text: "Build Successfully..."
    },
    {
      time: "08:16:15",
      text: "Your Website is live at GitHost."
    }
  ];

  return (
    <div className="max-w-screen-md mx-auto m-2 p-4 w-full h-screen">
      <h2 className="text-3xl font-semibold">
        GitHost Dashboard
      </h2>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex mt-10 gap-x-3"
        >
          <FormField
            control={form.control}
            name="gitrepo"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormControl>
                  <Input
                    className="w-full"
                    type="url"
                    placeholder="Enter Your Git-Repo Link..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">Deploy</Button>
        </form>
      </Form>

      <div className="mt-16">
        <div className="text-2xl font-semibold">
          Deployment Details
        </div>
      </div>

      <div className="mt-4 w-11/12">
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-lg pl-6">
              Build Logs
            </AccordionTrigger>
            <AccordionContent>
              {logs.map((ele, key) => (
                <div className="ml-6 pt-3 font-mono" key={key}>
                  <p>{ele.time} : {ele.text}</p>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="w-11/12">
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-lg pl-6">
              Deployment Summary
            </AccordionTrigger>
            <AccordionContent>
              <div className="ml-6 pt-3 font-mono">Your Website : https://priyanshuvaliya.githost.xyz</div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="w-11/12">
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-lg pl-6">
              Assigning Custom Domians
            </AccordionTrigger>
            <AccordionContent>
            <div className="ml-6 pt-3 font-mono">You Can Add Your Custom Domains. <u>Add Custom Domain</u></div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}

export default dashboard;
