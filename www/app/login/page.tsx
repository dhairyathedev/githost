import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";



function SignUpPage() {
    
    return (
   
<main className="container flex items-center justify-center h-screen w-4/3  ">

  <form className="container w-1/3 h-[full] border-2 border-gray-300 my-10 mx-20 rounded-xl  " >
             
    <h1 className='text-center font-medium text-xl py-3'> Welcome to <span className='font-bold text-2xl'> GitHost </span>  </h1>
    <h1 className="text-3xl font-medium px-8 mx-5 py-1 w-96 text-center"> Sign Up to Deploy your projects </h1>

  <div className="flex flex-col px-3">

  <Label htmlFor="email" className="font-semibold my-1 pt-2 mx-2">Email </Label>
  <Input className="border-2 border-gray-600 mt-1 rounded-full cursor-pointer shadow-bottom-md" type="email" id="email" placeholder='abc123@gmail.com' />

  <Label htmlFor="password" className="font-semibold my-1 pt-4 mx-2">Password </Label>
  <Input className="border-2 border-gray-600 mt-1 rounded-full cursor-pointer shadow-bottom-md" type="password" id="password" placeholder='enter password' />
  </div>

        <Button className="my-7 font-semibold w-80  bg-black text-white px-24 mx-7 py-2 rounded-2xl  hover:transition ease-in-out duration-700">
            Create account
        </Button>

    </form>   
</main>




    )
}

export default SignUpPage;