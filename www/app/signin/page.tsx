"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import {FieldValues, useForm} from 'react-hook-form'
import { z } from 'zod'


export default function SignUp() {

  const  SignupSchema = z.object({

    username: z.string().min(10, {message:"Minimum 10 character required!"}),
    email: z.string().email('Invalid email'),
    password: z.string().min(8,{message:"password must be of 8 characters!!"})

  })


  const {  register,
           handleSubmit,
           formState:{errors},
           reset,
        } = useForm({
          resolver:zodResolver(SignupSchema),
        });

  const onSubmit =(data: FieldValues) => {
      console.log(data);
  }      

  return (

    <div className="flex justify-center w-screen items-center h-screen ">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Create Your Account</h2>

        <form onSubmit={handleSubmit(onSubmit)}>

          <div className="mb-4">
            <label htmlFor="username" className="block text-gray-700 text-sm font-bold mb-2">Username</label>
            <input type="text" {... register("username")} 
            placeholder="Enter your username" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
            {
              errors?.username && (<p className="text-red-500"> {`${errors?.username.message}`} </p>)
            }
          </div>

          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Email</label>
            <input type="email" {... register("email")} 
          placeholder="Enter your email" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
           {
              errors?.email && (<p className="text-red-500"> {`${errors?.email.message}`} </p>)
            }
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">Password</label>
            <input type="password"  {... register("password")}  
             placeholder="Enter your password" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
              {
              errors?.password && (<p className="text-red-500"> {`${errors?.password.message}`} </p>)
            }
          </div>

          <div className="flex items-center justify-between">
            <button type ="submit"  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" >
              Sign Up
            </button>

          </div>

        </form>

      </div>
    </div>
  );
}
