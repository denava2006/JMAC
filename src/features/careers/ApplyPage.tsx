import * as React from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, Briefcase, Clock, FileText, Upload, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader } from '@/components/ui/loader'
import { Textarea } from '@/components/ui/textarea'
import { AddressFields, EMPTY_ADDRESS, type AddressValue } from '@/components/AddressFields'
import { cn } from '@/lib/utils'
import {
  EMPLOYMENT_TYPE_LABEL,
  fetchOpenPosition,
  isAcceptingApplications,
  openPositionsQueryKey,
} from '@/services/careers'
import { submitApplication, validateResumeFile } from '@/services/applications'

// Letters with single spaces, hyphens, or apostrophes between them — no digits,
// no other symbols, and no leading/trailing or doubled-up separators.
const nameRegex = /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/
const nameField = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(100)
    .regex(nameRegex, `${label} can only contain letters, spaces, hyphens, and apostrophes`)

// Philippine mobile numbers only: exactly 11 digits, starting with 09.
const phoneRegex = /^09\d{9}$/

const applicationSchema = z.object({
  firstName: nameField('First name'),
  middleName: nameField('Middle name'),
  lastName: nameField('Last name'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(phoneRegex, 'Enter a valid Philippine mobile number (11 digits, starting with 09)'),
  province: z.string().trim().min(1, 'Province is required'),
  city: z.string().trim().min(1, 'City or municipality is required'),
  barangay: z.string().trim().min(1, 'Barangay is required'),
  street: z.string().trim().min(1, 'Residential address is required').max(500),
  coverLetter: z.string().max(2000, 'Cover letter cannot exceed 2,000 characters').optional(),
})
type ApplicationFormValues = z.infer<typeof applicationSchema>

/** Strips everything but digits and caps the length at 11, as the user types. */
function sanitizePhoneInput(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 11)
}

/** Same idea for names: digits and symbols can never be typed in at all. */
function sanitizeNameInput(raw: string): string {
  return raw.replace(/[^A-Za-z '-]/g, '').slice(0, 100)
}

function formatFileSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function ResumeDropzone({
  file,
  onSelect,
  error,
}: {
  file: File | null
  onSelect: (file: File | null, error: string | null) => void
  error: string | null
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = React.useState(false)

  const handleFiles = (files: FileList | null) => {
    const picked = files?.[0]
    if (!picked) return
    const validationError = validateResumeFile(picked)
    onSelect(validationError ? null : picked, validationError)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="resume" required>
        Resume / CV
      </Label>
      {file ? (
        <div className="flex items-center justify-between gap-3 rounded-md border border-input bg-surface px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <FileText className="size-4 shrink-0 text-primary" aria-hidden="true" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-heading">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSelect(null, null)}
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-heading"
            aria-label="Remove selected resume"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragActive(true)
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragActive(false)
            handleFiles(e.dataTransfer.files)
          }}
          className={cn(
            'flex cursor-pointer flex-col items-center gap-2 rounded-md border-2 border-dashed px-4 py-8 text-center transition-colors',
            dragActive ? 'border-primary bg-muted' : 'border-input hover:border-primary/50',
            error && 'border-error'
          )}
        >
          <Upload className="size-6 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-heading">
            <span className="font-medium text-primary">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-muted-foreground">PDF, DOC, or DOCX — max 5 MB</p>
          <input
            ref={inputRef}
            id="resume"
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="sr-only"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      )}
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  )
}

function NotAvailable({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-6 py-24 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Briefcase className="size-8" aria-hidden="true" />
      </div>
      <h1 className="text-2xl font-semibold text-heading">{title}</h1>
      <p className="max-w-md text-body">{description}</p>
      <Button asChild variant="secondary">
        <Link to="/careers">Browse open positions</Link>
      </Button>
    </div>
  )
}

export function ApplyPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: posting, isPending } = useQuery({
    queryKey: [...openPositionsQueryKey, id],
    queryFn: () => fetchOpenPosition(id as string),
    enabled: Boolean(id),
  })

  const [resumeFile, setResumeFile] = React.useState<File | null>(null)
  const [resumeError, setResumeError] = React.useState<string | null>(null)
  const [submitError, setSubmitError] = React.useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ApplicationFormValues>({ resolver: zodResolver(applicationSchema) })
  const phoneField = register('phone')

  const mutation = useMutation({ mutationFn: submitApplication })

  if (isPending) {
    return (
      <div className="mx-auto grid max-w-2xl place-items-center px-6 py-24">
        <Loader size="lg" label="Loading this role" />
      </div>
    )
  }

  if (!posting) {
    return (
      <NotAvailable
        title="Job posting not found"
        description="This role may have closed or been filled. Take a look at our other open positions."
      />
    )
  }

  if (!isAcceptingApplications(posting)) {
    return (
      <NotAvailable
        title="Applications closed"
        description={`"${posting.title}" is no longer accepting applications. Take a look at our other open roles.`}
      />
    )
  }

  const onSubmit = async (values: ApplicationFormValues) => {
    setSubmitError(null)
    if (!resumeFile) {
      setResumeError('Please attach your resume to continue.')
      return
    }

    try {
      const { referenceCode } = await mutation.mutateAsync({
        jobPostingId: posting.id,
        firstName: values.firstName,
        middleName: values.middleName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
        province: values.province,
        city: values.city,
        barangay: values.barangay,
        street: values.street,
        coverLetter: values.coverLetter,
        resumeFile,
      })
      navigate('/careers/application-success', {
        replace: true,
        state: { jobTitle: posting.title, referenceCode, email: values.email },
      })
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    }
  }

  const addressValue: AddressValue = {
    province: watch('province') ?? '',
    city: watch('city') ?? '',
    barangay: watch('barangay') ?? '',
    street: watch('street') ?? '',
  }

  const submitting = isSubmitting || mutation.isPending

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Link
        to={`/careers/${posting.id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-heading"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to job details
      </Link>

      <div className="mt-6">
        <h1 className="text-3xl font-semibold tracking-tight text-heading">Apply for this role</h1>
        <Card className="mt-4">
          <CardContent className="flex flex-col gap-1.5 p-4">
            <div className="flex flex-wrap items-center gap-1.5">
              {posting.department && <Badge variant="info">{posting.department}</Badge>}
              <Badge variant="outline">{EMPLOYMENT_TYPE_LABEL[posting.employmentType] ?? posting.employmentType}</Badge>
            </div>
            <p className="text-base font-semibold text-heading">{posting.title}</p>
          </CardContent>
        </Card>
      </div>

      <form className="mt-8 flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        {submitError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-md border border-error/30 bg-error/10 px-3 py-2 text-sm text-error"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{submitError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="firstName" required>
              First name
            </Label>
            <Controller
              control={control}
              name="firstName"
              render={({ field }) => (
                <Input
                  id="firstName"
                  invalid={!!errors.firstName}
                  placeholder="Juan"
                  value={field.value ?? ''}
                  onBlur={field.onBlur}
                  onChange={(e) => field.onChange(sanitizeNameInput(e.target.value))}
                />
              )}
            />
            {errors.firstName && <p className="text-xs text-error">{errors.firstName.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="middleName" required>
              Middle name
            </Label>
            <Controller
              control={control}
              name="middleName"
              render={({ field }) => (
                <Input
                  id="middleName"
                  invalid={!!errors.middleName}
                  placeholder="Santos"
                  value={field.value ?? ''}
                  onBlur={field.onBlur}
                  onChange={(e) => field.onChange(sanitizeNameInput(e.target.value))}
                />
              )}
            />
            {errors.middleName && <p className="text-xs text-error">{errors.middleName.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lastName" required>
              Last name
            </Label>
            <Controller
              control={control}
              name="lastName"
              render={({ field }) => (
                <Input
                  id="lastName"
                  invalid={!!errors.lastName}
                  placeholder="Dela Cruz"
                  value={field.value ?? ''}
                  onBlur={field.onBlur}
                  onChange={(e) => field.onChange(sanitizeNameInput(e.target.value))}
                />
              )}
            />
            {errors.lastName && <p className="text-xs text-error">{errors.lastName.message}</p>}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email" required>
            Email address
          </Label>
          <Input
            id="email"
            type="email"
            invalid={!!errors.email}
            {...register('email')}
            placeholder="juan.delacruz@email.com"
          />
          {errors.email && <p className="text-xs text-error">{errors.email.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone" required>
            Phone number
          </Label>
          <Input
            id="phone"
            type="tel"
            inputMode="numeric"
            maxLength={11}
            invalid={!!errors.phone}
            {...phoneField}
            onChange={(e) => {
              e.target.value = sanitizePhoneInput(e.target.value)
              phoneField.onChange(e)
            }}
            placeholder="09XXXXXXXXX"
          />
          {errors.phone && <p className="text-xs text-error">{errors.phone.message}</p>}
        </div>

        <AddressFields
          value={addressValue}
          onChange={(next) => {
            setValue('province', next.province, { shouldValidate: true })
            setValue('city', next.city, { shouldValidate: true })
            setValue('barangay', next.barangay, { shouldValidate: true })
            setValue('street', next.street, { shouldValidate: true })
          }}
          errors={{
            province: errors.province?.message,
            city: errors.city?.message,
            barangay: errors.barangay?.message,
            street: errors.street?.message,
          }}
        />

        <ResumeDropzone
          file={resumeFile}
          error={resumeError}
          onSelect={(file, error) => {
            setResumeFile(file)
            setResumeError(error)
          }}
        />

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="coverLetter">Cover letter</Label>
          <Textarea
            id="coverLetter"
            invalid={!!errors.coverLetter}
            maxLength={2000}
            rows={5}
            {...register('coverLetter')}
            placeholder="Tell us why you're a great fit for this role (optional)"
          />
          {errors.coverLetter && <p className="text-xs text-error">{errors.coverLetter.message}</p>}
        </div>

        <div className="mt-2 flex items-start gap-2.5 rounded-md border border-border bg-muted px-3 py-2.5 text-sm">
          <Clock className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <p className="text-body">
            You&rsquo;ll get a reference number after submitting so you can check your application status any time.
          </p>
        </div>

        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? 'Submitting application…' : 'Submit application'}
        </Button>
      </form>
    </div>
  )
}
