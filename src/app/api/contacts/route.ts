import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get('search')
    
    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    const contacts = await prisma.contact.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 100
    })

    return NextResponse.json(contacts)
  } catch (error) {
    console.error('Get contacts error:', error)
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    
    if (!data.phone && !data.email) {
      return NextResponse.json({ 
        error: 'At least phone or email required' 
      }, { status: 400 })
    }

    const contact = await prisma.contact.create({ data })
    return NextResponse.json(contact)
  } catch (error: any) {
    console.error('Create contact error:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Contact already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 })
  }
}